# 🚀 Solsnipe Backend - Complete Usage Examples

This guide shows you exactly how to integrate wallet-based authentication and balance management into your application.

## 📱 Frontend Integration Examples

### JavaScript/TypeScript Example

```javascript
class SolsnipeAPI {
  constructor(baseURL) {
    this.baseURL = baseURL || 'https://your-site.netlify.app/api';
    this.token = localStorage.getItem('authToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // 1. Connect Wallet
  async connectWallet(walletAddress, chain = 'ethereum', metadata = {}) {
    try {
      const response = await fetch(`${this.baseURL}/anonymous-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          chain,
          metadata
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Store tokens
        this.token = data.data.token;
        this.refreshToken = data.data.refreshToken;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('refreshToken', this.refreshToken);
        
        console.log(`${data.data.isNewUser ? 'New' : 'Returning'} user connected!`);
        console.log('Balance:', data.data.balance);
        
        return data.data;
      }
      
      throw new Error(data.error);
    } catch (error) {
      console.error('Connect wallet error:', error);
      throw error;
    }
  }

  // 2. Get Balance
  async getBalance() {
    try {
      const response = await fetch(`${this.baseURL}/get-balance`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data.balance;
      }
      
      throw new Error(data.error);
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  }

  // NOTE: Credit and Debit operations are now admin-only
  // Use the SolsnipeAdminAPI class for balance modifications
  // Users can only view their balance and transaction history

  // 3. Get Transaction History
  async getTransactions(limit = 50, offset = 0, type = null) {
    try {
      let url = `${this.baseURL}/get-transactions?limit=${limit}&offset=${offset}`;
      if (type) url += `&type=${type}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      
      throw new Error(data.error);
    } catch (error) {
      console.error('Get transactions error:', error);
      throw error;
    }
  }

  // 4. Verify Token
  async verifyToken() {
    try {
      const response = await fetch(`${this.baseURL}/verify-token`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      const data = await response.json();
      return data.success && data.data.valid;
    } catch (error) {
      return false;
    }
  }

  // 7. Refresh Token
  async refreshAuthToken() {
    try {
      const response = await fetch(`${this.baseURL}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      const data = await response.json();
      
      if (data.success) {
        this.token = data.data.token;
        localStorage.setItem('authToken', this.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Refresh token error:', error);
      return false;
    }
  }

  // 8. Logout
  async logout() {
    try {
      await fetch(`${this.baseURL}/delete-session`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      this.token = null;
      this.refreshToken = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
  }
}

// Usage Example
const api = new SolsnipeAPI('https://your-site.netlify.app/api');

// Connect wallet (e.g., from MetaMask)
async function handleWalletConnect() {
  try {
    // Get wallet address from MetaMask or WalletConnect
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    const walletAddress = accounts[0];

    // Connect to backend
    const userData = await api.connectWallet(walletAddress, 'ethereum', {
      device: 'web',
      userAgent: navigator.userAgent
    });

    console.log('User data:', userData);
    console.log('Current balance:', userData.balance);
    
    // Show balance in UI
    document.getElementById('balance').textContent = userData.balance;
  } catch (error) {
    console.error('Failed to connect:', error);
  }
}

// Credit user for completing a task
async function rewardUser(taskId, amount) {
  try {
    const result = await api.creditWallet(amount, 'Task completion reward', {
      taskId,
      timestamp: new Date().toISOString()
    });
    
    console.log('User rewarded!', result);
    return result;
  } catch (error) {
    console.error('Failed to reward user:', error);
  }
}

// Purchase an item
async function purchaseItem(itemId, price) {
  try {
    // Check balance first
    const balance = await api.getBalance();
    
    if (balance < price) {
      alert('Insufficient balance!');
      return false;
    }

    // Debit the amount
    const result = await api.debitWallet(price, 'Item purchase', {
      itemId,
      itemPrice: price,
      purchaseTime: new Date().toISOString()
    });
    
    console.log('Purchase successful!', result);
    return true;
  } catch (error) {
    console.error('Purchase failed:', error);
    alert(error.message);
    return false;
  }
}

// View transaction history
async function showTransactionHistory() {
  try {
    const history = await api.getTransactions(20, 0);
    
    console.log('Transaction History:');
    console.log('Current Balance:', history.currentBalance);
    console.log('Total Credits:', history.totalCredits);
    console.log('Total Debits:', history.totalDebits);
    
    history.transactions.forEach(tx => {
      console.log(`${tx.type.toUpperCase()} - ${tx.amount} - ${tx.reason} - ${tx.timestamp}`);
    });
    
    return history;
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}
```

---

## 🎮 React Example

```jsx
import React, { useState, useEffect, createContext, useContext } from 'react';

// Create API context
const SolsnipeContext = createContext();

export function SolsnipeProvider({ children, apiUrl }) {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  const api = {
    baseURL: apiUrl || 'https://your-site.netlify.app/api',
    
    async connectWallet(walletAddress, chain = 'ethereum') {
      setLoading(true);
      try {
        const response = await fetch(`${this.baseURL}/anonymous-auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress, chain })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setToken(data.data.token);
          setUser(data.data);
          setBalance(data.data.balance);
          localStorage.setItem('authToken', data.data.token);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          return data.data;
        }
        
        throw new Error(data.error);
      } catch (error) {
        console.error('Connect error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    
    async getBalance() {
      try {
        const response = await fetch(`${this.baseURL}/get-balance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setBalance(data.data.balance);
          return data.data.balance;
        }
      } catch (error) {
        console.error('Get balance error:', error);
      }
    },
    
    async creditWallet(amount, reason, metadata = {}) {
      try {
        const response = await fetch(`${this.baseURL}/credit-wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount, reason, metadata })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setBalance(data.data.newBalance);
          return data.data;
        }
        
        throw new Error(data.error);
      } catch (error) {
        console.error('Credit error:', error);
        throw error;
      }
    },
    
    async debitWallet(amount, reason, metadata = {}) {
      try {
        const response = await fetch(`${this.baseURL}/debit-wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount, reason, metadata })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setBalance(data.data.newBalance);
          return data.data;
        }
        
        throw new Error(data.error);
      } catch (error) {
        console.error('Debit error:', error);
        throw error;
      }
    },
    
    async logout() {
      try {
        await fetch(`${this.baseURL}/delete-session`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } finally {
        setToken(null);
        setUser(null);
        setBalance(0);
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      }
    }
  };

  return (
    <SolsnipeContext.Provider value={{ api, user, balance, loading, token }}>
      {children}
    </SolsnipeContext.Provider>
  );
}

// Hook to use Solsnipe API
export function useSolsnipe() {
  return useContext(SolsnipeContext);
}

// Example Component
function WalletButton() {
  const { api, user, balance, loading } = useSolsnipe();

  const handleConnect = async () => {
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      await api.connectWallet(accounts[0], 'ethereum');
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  if (loading) return <button disabled>Loading...</button>;

  if (user) {
    return (
      <div>
        <p>Balance: {balance}</p>
        <button onClick={() => api.logout()}>Disconnect</button>
      </div>
    );
  }

  return <button onClick={handleConnect}>Connect Wallet</button>;
}
```

---

## 🌐 Flutter/Dart Example

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class SolsnipeAPI {
  final String baseURL;
  String? _token;
  String? _refreshToken;

  SolsnipeAPI({required this.baseURL}) {
    _loadTokens();
  }

  Future<void> _loadTokens() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('authToken');
    _refreshToken = prefs.getString('refreshToken');
  }

  Future<void> _saveTokens(String token, String refreshToken) async {
    _token = token;
    _refreshToken = refreshToken;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('authToken', token);
    await prefs.setString('refreshToken', refreshToken);
  }

  Future<Map<String, dynamic>> connectWallet(
    String walletAddress,
    String chain,
    Map<String, dynamic>? metadata,
  ) async {
    final response = await http.post(
      Uri.parse('$baseURL/anonymous-auth'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'walletAddress': walletAddress,
        'chain': chain,
        'metadata': metadata ?? {},
      }),
    );

    final data = json.decode(response.body);

    if (data['success']) {
      await _saveTokens(
        data['data']['token'],
        data['data']['refreshToken'],
      );
      return data['data'];
    }

    throw Exception(data['error']);
  }

  Future<int> getBalance() async {
    final response = await http.get(
      Uri.parse('$baseURL/get-balance'),
      headers: {'Authorization': 'Bearer $_token'},
    );

    final data = json.decode(response.body);

    if (data['success']) {
      return data['data']['balance'];
    }

    throw Exception(data['error']);
  }

  Future<Map<String, dynamic>> creditWallet(
    int amount,
    String reason, {
    Map<String, dynamic>? metadata,
  }) async {
    final response = await http.post(
      Uri.parse('$baseURL/credit-wallet'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
      body: json.encode({
        'amount': amount,
        'reason': reason,
        'metadata': metadata ?? {},
      }),
    );

    final data = json.decode(response.body);

    if (data['success']) {
      return data['data'];
    }

    throw Exception(data['error']);
  }

  Future<Map<String, dynamic>> debitWallet(
    int amount,
    String reason, {
    Map<String, dynamic>? metadata,
  }) async {
    final response = await http.post(
      Uri.parse('$baseURL/debit-wallet'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
      body: json.encode({
        'amount': amount,
        'reason': reason,
        'metadata': metadata ?? {},
      }),
    );

    final data = json.decode(response.body);

    if (data['success']) {
      return data['data'];
    }

    throw Exception(data['error']);
  }

  Future<void> logout() async {
    try {
      await http.delete(
        Uri.parse('$baseURL/delete-session'),
        headers: {'Authorization': 'Bearer $_token'},
      );
    } finally {
      _token = null;
      _refreshToken = null;
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('authToken');
      await prefs.remove('refreshToken');
    }
  }
}

// Usage
final api = SolsnipeAPI(baseURL: 'https://your-site.netlify.app/api');

void main() async {
  // Connect wallet
  final userData = await api.connectWallet(
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    'ethereum',
    {'device': 'mobile'},
  );

  print('Balance: ${userData['balance']}');

  // Credit wallet
  await api.creditWallet(100, 'Daily reward');

  // Get balance
  final balance = await api.getBalance();
  print('New balance: $balance');
}
```

---

## � Admin Panel Integration

### Admin Login & Balance Management

```javascript
class SolsnipeAdminAPI {
  constructor(baseURL) {
    this.baseURL = baseURL || 'https://your-site.netlify.app/api';
    this.adminToken = localStorage.getItem('adminToken');
    this.apiKey = null; // Set if using API key auth
  }

  // Admin Login
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (data.success) {
        this.adminToken = data.data.token;
        localStorage.setItem('adminToken', this.adminToken);
        localStorage.setItem('adminEmail', data.data.email);
        
        console.log('Admin logged in:', data.data.email);
        console.log('Token expires in:', data.data.expiresIn);
        
        return data.data;
      }
      
      throw new Error(data.error);
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  }

  // Credit Any Wallet (Admin Only)
  async creditWallet(walletAddress, amount, reason, metadata = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Use API key if available, otherwise Bearer token
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${this.adminToken}`;
      }

      const response = await fetch(`${this.baseURL}/credit-wallet`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          walletAddress,
          amount,
          reason,
          metadata 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`Credited ${amount} to ${walletAddress}`);
        console.log(`New balance: ${data.data.newBalance}`);
        console.log(`Credited by: ${data.data.creditedBy}`);
        return data.data;
      }
      
      throw new Error(data.error);
    } catch (error) {
      console.error('Admin credit error:', error);
      throw error;
    }
  }

  // Debit Any Wallet (Admin Only)
  async debitWallet(walletAddress, amount, reason, metadata = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${this.adminToken}`;
      }

      const response = await fetch(`${this.baseURL}/debit-wallet`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          walletAddress,
          amount,
          reason,
          metadata 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`Debited ${amount} from ${walletAddress}`);
        console.log(`New balance: ${data.data.newBalance}`);
        console.log(`Debited by: ${data.data.debitedBy}`);
        return data.data;
      }
      
      throw new Error(data.error);
    } catch (error) {
      console.error('Admin debit error:', error);
      throw error;
    }
  }

  // Set Balance Directly (Admin Only)
  async setBalance(walletAddress, balance, reason) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${this.adminToken}`;
      }

      const response = await fetch(`${this.baseURL}/set-balance`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ 
          walletAddress,
          balance,
          reason
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`Set balance for ${walletAddress} to ${balance}`);
        console.log(`Previous: ${data.data.previousBalance}, Difference: ${data.data.difference}`);
        console.log(`Adjusted by: ${data.data.adjustedBy}`);
        return data.data;
      }
      
      throw new Error(data.error);
    } catch (error) {
      console.error('Admin set balance error:', error);
      throw error;
    }
  }

  // Logout
  logout() {
    this.adminToken = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    console.log('Admin logged out');
  }
}

// Usage Example
const adminAPI = new SolsnipeAdminAPI('https://your-site.netlify.app/api');

// Login
await adminAPI.login('admin@solsnipe.com', 'your_password');

// Credit a wallet
await adminAPI.creditWallet(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  500,
  'Promotional bonus',
  { campaign: 'new_year_2025' }
);

// Debit a wallet
await adminAPI.debitWallet(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  100,
  'Service fee',
  { serviceType: 'premium_feature' }
);

// Set balance directly
await adminAPI.setBalance(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  1000,
  'Balance correction after audit'
);
```

### Admin Panel with API Key (Backend Service)

```javascript
// For server-to-server communication
class BackendAdminService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://your-site.netlify.app/api';
  }

  async creditUser(walletAddress, amount, reason) {
    const response = await fetch(`${this.baseURL}/credit-wallet`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ walletAddress, amount, reason })
    });

    return await response.json();
  }

  async processReward(walletAddress, rewardType) {
    const amounts = {
      'daily_login': 10,
      'referral': 50,
      'quest_complete': 100
    };

    const amount = amounts[rewardType];
    
    return await this.creditUser(
      walletAddress,
      amount,
      `Reward: ${rewardType}`
    );
  }
}

// Usage in your backend
const adminService = new BackendAdminService(process.env.SUPER_ADMIN_API_KEY);
await adminService.processReward('0x742d35Cc...', 'quest_complete');
```

---

## �💡 Common Use Cases

### 1. Gaming Platform - Reward System (Admin-Controlled)
```javascript
// Backend service rewards users for completing levels
async function completeLevel(userId, walletAddress, levelId, score) {
  const reward = calculateReward(score);
  
  // Admin service credits the wallet
  await adminAPI.creditWallet(
    walletAddress,
    reward,
    'Level completion reward',
    {
      userId,
      levelId,
      score,
      completedAt: new Date().toISOString()
    }
  );
}

// User purchases in-game item (admin debits the wallet)
async function buyItem(walletAddress, itemId, price) {
  const result = await adminAPI.debitWallet(
    walletAddress,
    price,
    'Item purchase',
    {
      itemId,
      itemType: 'weapon'
    }
  );
  
  // Grant item to user
  grantItemToPlayer(walletAddress, itemId);
  return result;
}
```

### 2. DeFi/Trading Platform (Admin-Managed)
```javascript
// Backend tracks and debits trading fees
async function executeTrade(walletAddress, amount, fee) {
  await adminAPI.debitWallet(
    walletAddress,
    fee,
    'Trading fee',
    {
      tradeAmount: amount,
      timestamp: Date.now()
    }
  );
}

// Backend distributes staking rewards
async function distributeStakingRewards(stakingRecords) {
  for (const record of stakingRecords) {
    const reward = calculateStakingReward(record.amount);
    
    await adminAPI.creditWallet(
      record.walletAddress,
      reward,
      'Staking reward',
      {
        stakingAmount: record.amount,
        rewardRate: 5.5,
        period: '30days'
      }
    );
  }
}
```

### 3. Social Platform - Tipping System (Escrow Model)
```javascript
// User initiates tip (frontend request to backend)
async function processTip(fromWallet, toWallet, amount) {
  // Backend admin service handles the transfer
  
  // 1. Debit from sender
  await adminAPI.debitWallet(
    fromWallet,
    amount,
    'Tip sent',
    {
      recipientWallet: toWallet,
      timestamp: Date.now()
    }
  );
  
  // 2. Credit to recipient
  await adminAPI.creditWallet(
    toWallet,
    amount,
    'Tip received',
    {
      senderWallet: fromWallet,
      timestamp: Date.now()
    }
  );
  
  return { success: true, amount };
}
```

---

## 🔐 Security Best Practices

1. **Never expose tokens in URLs** - Always use headers
2. **Always use HTTPS in production** - Especially for admin operations
3. **Implement token refresh logic** - Admin tokens expire in 24 hours
4. **Validate amounts on both frontend and backend** - Prevent malicious inputs
5. **Store sensitive data in environment variables** - Never commit secrets
6. **Admin credentials should be strong** - Use password managers
7. **Rotate API keys regularly** - Especially if compromised
8. **Monitor admin operations** - Log all balance modifications
9. **Separate user and admin auth** - Different token types and permissions
10. **Use API keys for backend services** - More secure than storing admin passwords

---

**Need help? Check the main [README.md](./README.md) for full API documentation!**
