module example::Counter {
  use std::signer;
  
  struct Counter has key, store {
    value: u64,
  }
  
  public entry fun initialize(account: &signer) {
    move_to(account, Counter { value: 0 });
  }
  
  public entry fun increment(account: &signer) acquires Counter {
    let counter = borrow_global_mut<Counter>(signer::address_of(account));
    counter.value = counter.value + 1;
  }
  
  public fun get(account: address): u64 acquires Counter {
    let counter = borrow_global<Counter>(account);
    counter.value
  }
}