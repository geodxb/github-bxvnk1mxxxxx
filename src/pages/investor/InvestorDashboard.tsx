@@ .. @@
 import React from 'react';
-import { TrendingUp, DollarSign, PieChart, History } from 'lucide-react';
+import { TrendingUp, DollarSign, PieChart } from 'lucide-react';
 import { Link } from 'react-router-dom';
@@ .. @@
           </div>
         </div>
 
-        {/* Quick Actions */}
-        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
-          <Link
-            to="/investor/active"
-            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
-          >
-            <div className="flex items-center">
-              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
-              <div>
-                <h3 className="font-semibold text-gray-900">Active Investments</h3>
-                <p className="text-sm text-gray-600">View your active positions</p>
-              </div>
-            </div>
-          </Link>
-
-          <Link
-            to="/investor/transactions"
-            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
-          >
-            <div className="flex items-center">
-              <History className="h-8 w-8 text-blue-600 mr-3" />
-              <div>
-                <h3 className="font-semibold text-gray-900">Transaction History</h3>
-                <p className="text-sm text-gray-600">Review past transactions</p>
-              </div>
-            </div>
-          </Link>
-
-          <Link
-            to="/investor/holdings"
-            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
-          >
-            <div className="flex items-center">
-              <PieChart className="h-8 w-8 text-purple-600 mr-3" />
-              <div>
-                <h3 className="font-semibold text-gray-900">Portfolio Holdings</h3>
-                <p className="text-sm text-gray-600">Detailed portfolio view</p>
-              </div>
-            </div>
-          </Link>
-        </div>
-
         {/* Recent Activity */}
         <div className="bg-white rounded-lg shadow-sm border">
@@ .. @@