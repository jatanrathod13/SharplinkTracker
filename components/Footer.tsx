import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-slate-900/50 backdrop-blur-sm border-t border-slate-700 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Project Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-white font-bold text-sm">SL</div>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="text-white font-bold text-lg">SharpLink Gaming</div>
                <div className="text-blue-400 text-sm">ETH Treasury Analytics</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              An independent analytics platform tracking SharpLink Gaming's Ethereum treasury strategy. 
              This dashboard provides real-time insights into ETH holdings, staking rewards, and DeFi opportunities.
              Not officially affiliated with any company.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Real-time Data</span>
              <span>•</span>
              <span>ETH Analytics</span>
              <span>•</span>
              <span>Community Project</span>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-blue-400 transition-colors">ETH Analytics</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Market Data</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Staking Rewards</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">GitHub Repository</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400 mb-4 md:mb-0">
            © 2025 SharpLink Gaming ETH Tracker. Independent community project.
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Contact</a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-amber-200 leading-relaxed">
            <strong>Disclaimer:</strong> This is an independent community project for educational and informational purposes only. 
            Not officially affiliated with SharpLink Gaming or any company. Cryptocurrency data is volatile and should not 
            be considered investment advice. Always do your own research before making financial decisions.
          </p>
        </div>
      </div>
    </footer>
  )
} 