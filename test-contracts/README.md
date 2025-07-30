# Test Contracts

Bu klasör, Umi Playground için test amaçlı karmaşık smart contract'ları içerir.

## 📁 Dosyalar

### Solidity Contracts

#### 1. **HelloWorld.sol** (Basit)
- **Amaç**: Temel Solidity contract örneği
- **Özellikler**:
  - Mesaj güncelleme
  - Owner kontrolü
  - Event'ler
  - View fonksiyonları

#### 2. **Counter.sol** (Basit)
- **Amaç**: En basit counter contract
- **Özellikler**:
  - Increment fonksiyonu
  - Public count değişkeni

#### 3. **TokenVault.sol** (Karmaşık) ⭐
- **Amaç**: Gelişmiş staking ve governance sistemi
- **Özellikler**:
  - **Staking Sistemi**:
    - Token stake etme/çekme
    - Otomatik ödül hesaplama
    - Reentrancy koruması
  - **Governance Sistemi**:
    - Proposal oluşturma
    - Oy verme sistemi
    - Quorum kontrolü
    - Proposal execution
  - **Güvenlik**:
    - Emergency withdraw
    - Owner kontrolleri
    - Modifier'lar
  - **View Fonksiyonları**:
    - User stake bilgileri
    - Proposal bilgileri
    - Ödül hesaplamaları

### Move Contracts

#### 1. **counter.move** (Basit)
- **Amaç**: Temel Move counter
- **Özellikler**:
  - Initialize fonksiyonu
  - Increment fonksiyonu
  - Get fonksiyonu

#### 2. **advanced_vault.move** (Karmaşık) ⭐
- **Amaç**: Gelişmiş Move staking ve governance sistemi
- **Özellikler**:
  - **Staking Sistemi**:
    - Token stake etme/çekme
    - Zaman bazlı ödül hesaplama
    - Minimum stake kontrolü
  - **Governance Sistemi**:
    - Proposal oluşturma
    - Oy verme (voting power ile)
    - Proposal execution
  - **Event Sistemi**:
    - Stake/Withdraw events
    - Reward claim events
    - Proposal events
    - Vote events
  - **Admin Fonksiyonları**:
    - Reward rate ayarlama
    - Voting period ayarlama
    - Quorum ayarlama
  - **View Fonksiyonları**:
    - Vault bilgileri
    - User stake bilgileri
    - Proposal bilgileri
    - Pending rewards

## 🚀 Test Senaryoları

### TokenVault.sol Test Senaryoları

1. **Staking Testleri**:
   ```javascript
   // Stake tokens
   await tokenVault.stake(1000);
   
   // Check user stake
   const userStake = await tokenVault.getUserStake(userAddress);
   
   // Withdraw tokens
   await tokenVault.withdraw(500);
   ```

2. **Reward Testleri**:
   ```javascript
   // Claim rewards
   await tokenVault.claimReward();
   
   // Check earned rewards
   const earned = await tokenVault.earned(userAddress);
   ```

3. **Governance Testleri**:
   ```javascript
   // Create proposal
   await tokenVault.createProposal("Test proposal");
   
   // Vote on proposal
   await tokenVault.vote(0, true);
   
   // Execute proposal
   await tokenVault.executeProposal(0);
   ```

### advanced_vault.move Test Senaryoları

1. **Staking Testleri**:
   ```move
   // Initialize vault
   advanced_vault::initialize(&account);
   
   // Stake tokens
   advanced_vault::stake(&account, 1000000);
   
   // Withdraw tokens
   advanced_vault::withdraw(&account, 500000);
   ```

2. **Reward Testleri**:
   ```move
   // Claim rewards
   advanced_vault::claim_rewards(&account);
   
   // Check pending rewards
   let rewards = advanced_vault::get_pending_rewards(account_addr);
   ```

3. **Governance Testleri**:
   ```move
   // Create proposal
   advanced_vault::create_proposal(&account, string::utf8(b"Test proposal"));
   
   // Vote on proposal
   advanced_vault::vote(&account, 0, true);
   
   // Execute proposal
   advanced_vault::execute_proposal(&owner, 0);
   ```

## 🔧 Kullanım

### Solidity Contract Deploy
```bash
# Hardhat ile deploy
npx hardhat run scripts/deploy.js --network localhost

# Truffle ile deploy
truffle migrate --network development
```

### Move Contract Deploy
```bash
# Aptos CLI ile deploy
aptos move publish --named-addresses example=0x123...

# Sui CLI ile deploy
sui client publish --gas-budget 10000000
```

## 📊 Contract Karşılaştırması

| Özellik | HelloWorld.sol | Counter.sol | TokenVault.sol | counter.move | advanced_vault.move |
|---------|----------------|-------------|----------------|--------------|-------------------|
| Karmaşıklık | Basit | Çok Basit | Karmaşık | Basit | Karmaşık |
| Staking | ❌ | ❌ | ✅ | ❌ | ✅ |
| Governance | ❌ | ❌ | ✅ | ❌ | ✅ |
| Events | ✅ | ❌ | ✅ | ❌ | ✅ |
| Admin Functions | ✅ | ❌ | ✅ | ❌ | ✅ |
| Security Features | ✅ | ❌ | ✅ | ❌ | ✅ |
| View Functions | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🎯 Test Önerileri

1. **Edge Cases**:
   - Sıfır miktar stake/withdraw
   - Yetersiz bakiye
   - Geçersiz proposal ID'leri
   - Oy verme süresi sonrası

2. **Security Tests**:
   - Reentrancy attacks
   - Unauthorized access
   - Overflow/underflow
   - Access control

3. **Integration Tests**:
   - Token transfer entegrasyonu
   - Event emission
   - State consistency
   - Gas optimization

## 📝 Notlar

- **TokenVault.sol** ve **advanced_vault.move** en karmaşık contract'lardır
- Her iki contract da production-ready değildir, sadece test amaçlıdır
- OpenZeppelin kütüphaneleri kullanılmıştır (Solidity)
- Move contract'ları Aptos/Sui ile uyumludur
- Tüm contract'lar test edilmiştir ve çalışır durumdadır 