module defix::ProblemRegistry {
    use std::signer;
    use std::vector;
    use std::option::{Self, Option};
    use aptos_std::table::{Self, Table};
    use aptos_std::coin;
    use aptos_std::aptos_coin::AptosCoin;

    struct Solution has store {
        id: u64,
        solver: address,
        cid: vector<u8>,
        votes: u64,
    }

    struct Problem has store, key {
        id: u64,
        owner: address,
        cid: vector<u8>,
        lat: vector<u8>,
        lng: vector<u8>,
        bounty_octas: u64,
        open: bool,
        solutions: vector<Solution>,
        chosen: Option<u64>,
    }

    struct Registry has key {
        next_problem_id: u64,
        problems: Table<u64, Problem> ,
    }

    fun ensure_registry(account: &signer) {
        let addr = signer::address_of(account);
        if (!exists<Registry>(addr)) {
            let problems: Table<u64, Problem> = table::new<u64, Problem>();
            move_to(account, Registry { next_problem_id: 1, problems });
        }
    }

    public entry fun create_problem(account: &signer, cid: vector<u8>, lat: vector<u8>, lng: vector<u8>, bounty_octas: u64) acquires Registry {
        ensure_registry(account);
        let addr = signer::address_of(account);
        let reg = borrow_global_mut<Registry>(addr);
        let id = reg.next_problem_id;
        reg.next_problem_id = id + 1;
        let p = Problem {
            id,
            owner: addr,
            cid,
            lat,
            lng,
            bounty_octas,
            open: true,
            solutions: vector::empty<Solution>(),
            chosen: option::none<u64>(),
        };
        table::add(&mut reg.problems, id, p);
    }

    public entry fun add_solution(account: &signer, problem_id: u64, solver_addr: address, cid: vector<u8>) acquires Registry {
        let addr = signer::address_of(account);
        let reg = borrow_global_mut<Registry>(addr);
        let p_ref = table::borrow_mut(&mut reg.problems, problem_id);
        assert!(p_ref.open, 1);
        // Optional safety: the solver must be the signer
        assert!(solver_addr == signer::address_of(account), 2);
        let new_id = (vector::length<Solution>(&p_ref.solutions) as u64) + 1;
        let sol = Solution { id: new_id, solver: solver_addr, cid, votes: 0 };
        vector::push_back(&mut p_ref.solutions, sol);
    }

    public entry fun vote_solution(_voter: &signer, problem_id: u64, solution_id: u64) acquires Registry {
        // For MVP: no anti-sybil checks; production would limit to one vote per address
        let addr = signer::address_of(_voter);
        let reg = borrow_global_mut<Registry>(addr);
        let p_ref = table::borrow_mut(&mut reg.problems, problem_id);
        assert!(p_ref.open, 3);
        let i = 0;
        let len = vector::length<Solution>(&p_ref.solutions);
        while (i < len) {
            let s_ref = vector::borrow_mut<Solution>(&mut p_ref.solutions, i);
            if (s_ref.id == solution_id) {
                s_ref.votes = s_ref.votes + 1;
                return
            };
            i = i + 1;
        };
        abort 4; // solution not found
    }

    public entry fun release_reward(owner: &signer, problem_id: u64, solution_id: u64) acquires Registry {
        let addr = signer::address_of(owner);
        let reg = borrow_global_mut<Registry>(addr);
        let p_ref = table::borrow_mut(&mut reg.problems, problem_id);
        // Only problem owner can release
        assert!(p_ref.owner == addr, 5);
        assert!(p_ref.open, 6);

        let solver_found = addr;
        let i = 0;
        let len = vector::length<Solution>(&p_ref.solutions);
        while (i < len) {
            let s_ref = vector::borrow_mut<Solution>(&mut p_ref.solutions, i);
            if (s_ref.id == solution_id) {
                solver_found = s_ref.solver;
                break
            };
            i = i + 1;
        };
        assert!(solver_found != addr, 7); // must find a solution

        // Transfer AptosCoin bounty from owner to solver
        coin::transfer<AptosCoin>(owner, solver_found, p_ref.bounty_octas);
        p_ref.open = false;
        p_ref.chosen = option::some<u64>(solution_id);
    }
}
