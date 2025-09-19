@@ .. @@
   // Mock API keys for demo
   const mockApiKeys = [
     {
       id: '1',
       name: 'Binance Main Account',
       exchange: 'Binance',
       permissions: ['read', 'trade', 'futures'],
       isActive: true
     },
     {
       id: '2',
       name: 'OKX Trading Account', 
       exchange: 'OKX',
       permissions: ['read', 'trade', 'futures'],
       isActive: true
     },
+    {
+      id: '3',
+      name: 'Binance Futures Pro',
+      exchange: 'Binance',
+      permissions: ['read', 'trade', 'futures'],
+      isActive: true
+    },
+    {
+      id: '4',
+      name: 'OKX Copy Trading',
+      exchange: 'OKX', 
+      permissions: ['read', 'trade', 'copy_trading'],
+      isActive: true
+    }
   ];