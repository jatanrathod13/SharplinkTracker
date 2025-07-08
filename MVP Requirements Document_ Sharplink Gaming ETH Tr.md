<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# MVP Requirements Document: Sharplink Gaming ETH Treasury Tracker

## 1. MVP Scope \& Objectives

### 1.1 Core Purpose

Build a simplified version of StrategyTracker's MSTR analytics platform focused on **Sharplink Gaming's ETH treasury strategy**, deployable on Render with minimal infrastructure complexity.

### 1.2 MVP Feature Set

Based on the StrategyTracker analysis, the MVP will include **4 primary visualizations**:

- **NAV Multiplier Chart**: Market cap to ETH holdings ratio over time[^1][^2]
- **Performance Comparison**: Stock performance vs direct ETH investment[^3][^4]
- **ETH Treasury Holdings**: Real-time ETH balance and accumulation tracking[^5]
- **ETH Yield Metrics**: ETH per share calculations and trends[^3][^4]


## 2. Required Charts \& Visualizations

### 2.1 Primary Dashboard Charts

**NAV Multiplier vs ETH Price**[^2]

- X-axis: Time periods (1D, 1W, 1M, 3M, 1Y)
- Y-axis: Dual axis showing NAV multiplier and ETH price
- Formula: `Market Cap ÷ (ETH Holdings × ETH Price)`

**Performance Comparison Chart**[^3][^4]

- Compare Sharplink Gaming stock vs ETH direct investment returns
- Benchmark against major indices (S\&P 500, tech sector)
- Display percentage returns over multiple timeframes

**ETH Treasury Reserve Chart**[^5]

- Total ETH holdings over time
- ETH accumulation events and timing
- Current treasury value in USD

**ETH Yield Analysis**[^3]

- ETH per share calculations: `Total ETH Holdings ÷ Outstanding Shares`
- Track "ETH Yield" changes during equity/debt issuances
- Display dilution impact on ETH backing per share


### 2.2 Key Performance Indicators (KPIs)[^1][^4]

- **Current Stock Price** with daily change percentage
- **Market Capitalization** and change from previous close
- **ETH Holdings Value** in USD
- **NAV Premium/Discount** percentage
- **ETH per Share** ratio
- **3-Month and 1-Year Returns**


## 3. Data Sources \& APIs

### 3.1 ETH Price Data

**Primary Source**: CoinGecko API (free tier)

- Endpoint: `/simple/price` for current ETH price
- Endpoint: `/coins/ethereum/market_chart` for historical data
- Update frequency: Every 60 seconds for MVP

**Backup Source**: CoinMarketCap API

- Redundancy for price feed reliability
- Switch automatically if primary fails


### 3.2 Stock Market Data

**Yahoo Finance API** (via `yfinance` Python library)

- Stock price for Sharplink Gaming ticker
- Market cap calculations
- Outstanding shares count
- Benchmark indices (SPY, QQQ) for comparison


### 3.3 On-Chain ETH Treasury Data

**Ethereum Mainnet RPC**

- Monitor specific treasury wallet addresses
- Use Alchemy or Infura free tier (100k requests/day)
- Track ETH balance changes and transaction history
- Endpoint: `eth_getBalance` for current holdings


### 3.4 Alternative Data Sources

**Etherscan API** (free tier: 5 calls/second)

- Verify treasury wallet balances
- Historical transaction data
- Token transfer events


## 4. Technical Architecture (Render-Optimized)

### 4.1 Application Stack

**Backend**: Python Flask/FastAPI

- Lightweight web framework suitable for Render deployment
- Built-in API endpoints for data serving
- Background tasks for data collection

**Database**: SQLite (for MVP simplicity)

- File-based database (no external DB service needed)
- Store historical price data and calculated metrics
- Automatic migrations and backups

**Frontend**: React.js with Chart.js

- Single-page application
- Responsive design for mobile/desktop
- Real-time chart updates via WebSocket or polling


### 4.2 Data Collection Strategy

**Scheduled Jobs**: APScheduler (Python)

- ETH price updates: Every 60 seconds
- Stock price updates: Every 5 minutes during market hours
- Treasury balance checks: Every 15 minutes
- Historical data backfill: Daily at midnight

**Data Storage Pattern**:

```sql
-- Price history table
CREATE TABLE price_history (
    timestamp DATETIME,
    eth_price DECIMAL,
    stock_price DECIMAL,
    market_cap BIGINT,
    eth_holdings DECIMAL
);

-- Calculated metrics table  
CREATE TABLE metrics (
    timestamp DATETIME,
    nav_multiplier DECIMAL,
    eth_per_share DECIMAL,
    nav_premium_pct DECIMAL
);
```


## 5. Deployment Configuration (Render)

### 5.1 Service Setup

**Web Service Configuration**:

- Runtime: Python 3.11
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app`
- Auto-deploy from GitHub repository

**Environment Variables**:

```
COINGECKO_API_KEY=your_api_key
ALCHEMY_API_KEY=your_alchemy_key  
TREASURY_WALLET_ADDRESS=0x...
STOCK_TICKER=SGLG (or actual ticker)
```


### 5.2 Resource Requirements

- **Instance Type**: Starter (\$7/month sufficient for MVP)
- **RAM**: 512MB (adequate for SQLite and basic operations)
- **Storage**: Persistent disk for SQLite database
- **Bandwidth**: Standard (sufficient for API calls and chart serving)


## 6. Core Features Implementation

### 6.1 Real-time Data Pipeline

```python
# Simplified data collection workflow
def collect_market_data():
    eth_price = get_eth_price()  # CoinGecko API
    stock_data = get_stock_data()  # Yahoo Finance
    eth_balance = get_treasury_balance()  # Ethereum RPC
    
    # Calculate derived metrics
    nav_multiplier = stock_data['market_cap'] / (eth_balance * eth_price)
    eth_per_share = eth_balance / stock_data['shares_outstanding']
    
    # Store in database
    save_metrics(timestamp, nav_multiplier, eth_per_share)
```


### 6.2 API Endpoints

```
GET /api/current-metrics
GET /api/price-history?timeframe=1M
GET /api/performance-comparison?period=1Y
GET /api/treasury-stats
```


### 6.3 Chart Rendering

**Chart.js Configuration** for NAV Multiplier:

```javascript
// Dual-axis chart similar to StrategyTracker
const chartConfig = {
    type: 'line',
    data: {
        datasets: [{
            label: 'NAV Multiplier',
            yAxisID: 'y',
            data: navMultiplierData
        }, {
            label: 'ETH Price',
            yAxisID: 'y1', 
            data: ethPriceData
        }]
    },
    options: {
        scales: {
            y: { position: 'left' },
            y1: { position: 'right' }
        }
    }
};
```


## 7. MVP Timeline \& Deliverables

### Week 1: Infrastructure Setup

- Render deployment configuration
- Database schema creation
- Basic API endpoints


### Week 2: Data Integration

- ETH price feed integration
- Stock data collection
- Treasury wallet monitoring


### Week 3: Frontend Development

- Chart implementations
- Dashboard layout
- Mobile responsiveness


### Week 4: Testing \& Polish

- Data accuracy validation
- Performance optimization
- User interface refinement


## 8. Success Metrics

### 8.1 Technical Performance

- **Page Load Time**: < 3 seconds
- **Data Freshness**: < 2 minutes for all metrics
- **Uptime**: 99%+ availability
- **API Response**: < 500ms average


### 8.2 Feature Completeness

- All 4 core charts functional and accurate[^1][^2]
- Real-time data updates working
- Mobile-responsive design
- Export/sharing capabilities[^4]

This MVP approach leverages Render's simplicity while delivering the core functionality demonstrated in StrategyTracker's MSTR analytics platform, adapted for ETH treasury strategy tracking.

<div style="text-align: center">⁂</div>

[^1]: https://www.strategy.com

[^2]: https://strategytracker.com/mstr/?chart=btcYield\&subNav=quarterly

[^3]: https://www.youtube.com/watch?v=XKqYhXfMgsM

[^4]: https://apps.apple.com/us/app/strategy/id6739429190

[^5]: https://www.vaneck.com/asia/en/news-and-insights/blogs/digital-assets/matthew-sigel-deconstructing-strategy-mstr-premium-leverage-and-capital-structure/

[^6]: https://www.youtube.com/watch?v=4oG5Nep7i78

[^7]: https://www.tradingview.com/symbols/NASDAQ-MSTR/

[^8]: https://www.tradingview.com/chart/MSTR/2vUYDSuE-MSTR-Daily-Chart-Analysis-Key-Price-Levels/

[^9]: https://www.ibm.com/docs/en/manta-data-lineage?topic=microstrategy-scanner-guide

[^10]: https://financhill.com/stock-price-chart/mstr-technical-analysis

