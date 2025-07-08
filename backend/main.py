from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sqlite3
import requests
import yfinance as yf
from web3 import Web3
import os
from datetime import datetime, timedelta
import json
from typing import Dict, List, Optional
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import pandas as pd
from pydantic import BaseModel
from dotenv import load_dotenv
import csv

load_dotenv()

app = FastAPI(title="Sharplink ETH Treasury Tracker", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY", "")
ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY", "")
TREASURY_WALLET_ADDRESS = os.getenv("TREASURY_WALLET_ADDRESS", "0x742d35Cc6634C0532925a3b8D2a2c2c8e5a2e1a8")
STOCK_TICKER = os.getenv("STOCK_TICKER", "SGLG")

# Database setup
DATABASE = "treasury_tracker.db"

def init_database():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Price history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            eth_price REAL,
            stock_price REAL,
            market_cap BIGINT,
            eth_holdings REAL,
            outstanding_shares BIGINT
        )
    """)
    
    # Calculated metrics table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            nav_multiplier REAL,
            eth_per_share REAL,
            nav_premium_pct REAL,
            treasury_value_usd REAL
        )
    """)
    
    # Treasury transactions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS treasury_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME,
            transaction_hash TEXT,
            block_number INTEGER,
            value_eth REAL,
            balance_after REAL
        )
    """)
    
    # CSV historical data table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS eth_historical_csv (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME,
            open_price REAL,
            high_price REAL,
            low_price REAL,
            close_price REAL,
            volume REAL,
            source TEXT DEFAULT 'perplexity_csv'
        )
    """)
    
    # SBET stock historical data table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sbet_historical_csv (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME,
            open_price REAL,
            high_price REAL,
            low_price REAL,
            close_price REAL,
            volume REAL,
            source TEXT DEFAULT 'perplexity_csv'
        )
    """)
    
    # ETH purchase transactions table (enhanced)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS eth_purchase_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME,
            transaction_hash TEXT,
            eth_quantity REAL,
            eth_price_usd REAL,
            total_cost_usd REAL,
            shares_outstanding BIGINT,
            pre_purchase_eth_holdings REAL,
            post_purchase_eth_holdings REAL,
            concentration_change_pct REAL,
            notes TEXT
        )
    """)
    
    # ETH concentration analysis table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS eth_concentration_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME,
            total_eth_holdings REAL,
            market_cap_usd REAL,
            eth_concentration_pct REAL,
            treasury_value_usd REAL,
            shares_outstanding BIGINT,
            eth_per_share REAL,
            nav_multiplier REAL
        )
    """)
    
    conn.commit()
    conn.close()

class DataCollector:
    def __init__(self):
        self.w3 = None
        if ALCHEMY_API_KEY:
            self.w3 = Web3(Web3.HTTPProvider(f"https://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}"))
    
    async def get_eth_price(self) -> float:
        """Get current ETH price from CoinGecko"""
        try:
            url = "https://api.coingecko.com/api/v3/simple/price"
            params = {
                "ids": "ethereum",
                "vs_currencies": "usd"
            }
            if COINGECKO_API_KEY:
                params["x_cg_demo_api_key"] = COINGECKO_API_KEY
                
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            return float(data["ethereum"]["usd"])
        except Exception as e:
            print(f"Error fetching ETH price: {e}")
            return 0.0
    
    async def get_eth_historical_data(self, days: int = 30) -> List[Dict]:
        """Get historical ETH price data"""
        try:
            url = f"https://api.coingecko.com/api/v3/coins/ethereum/market_chart"
            params = {
                "vs_currency": "usd",
                "days": days,
                "interval": "daily" if days > 1 else "hourly"
            }
            if COINGECKO_API_KEY:
                params["x_cg_demo_api_key"] = COINGECKO_API_KEY
                
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            historical_data = []
            for price_point in data["prices"]:
                historical_data.append({
                    "timestamp": datetime.fromtimestamp(price_point[0] / 1000),
                    "price": price_point[1]
                })
            return historical_data
        except Exception as e:
            print(f"Error fetching ETH historical data: {e}")
            return []
    
    async def get_stock_data(self) -> Dict:
        """Get stock data using yfinance"""
        try:
            stock = yf.Ticker(STOCK_TICKER)
            info = stock.info
            hist = stock.history(period="1d")
            
            current_price = float(hist['Close'].iloc[-1]) if not hist.empty else 0.0
            market_cap = info.get('marketCap', 0)
            shares_outstanding = info.get('sharesOutstanding', 0)
            
            return {
                "price": current_price,
                "market_cap": market_cap,
                "shares_outstanding": shares_outstanding,
                "daily_change": float(hist['Close'].pct_change().iloc[-1]) if len(hist) > 1 else 0.0
            }
        except Exception as e:
            print(f"Error fetching stock data: {e}")
            return {
                "price": 0.0,
                "market_cap": 0,
                "shares_outstanding": 0,
                "daily_change": 0.0
            }
    
    async def get_treasury_balance(self) -> float:
        """Get current ETH balance of treasury wallet"""
        try:
            if not self.w3 or not self.w3.is_connected():
                return 0.0
                
            balance_wei = self.w3.eth.get_balance(TREASURY_WALLET_ADDRESS)
            balance_eth = self.w3.from_wei(balance_wei, 'ether')
            return float(balance_eth)
        except Exception as e:
            print(f"Error fetching treasury balance: {e}")
            return 0.0
    
    async def collect_and_store_data(self):
        """Collect all data and store in database"""
        try:
            # Get current data
            eth_price = await self.get_eth_price()
            stock_data = await self.get_stock_data()
            eth_balance = await self.get_treasury_balance()
            
            # Calculate metrics
            market_cap = stock_data["market_cap"]
            shares_outstanding = stock_data["shares_outstanding"]
            
            nav_multiplier = 0.0
            eth_per_share = 0.0
            nav_premium_pct = 0.0
            treasury_value_usd = eth_balance * eth_price
            
            if eth_balance > 0 and eth_price > 0 and market_cap > 0:
                nav_multiplier = market_cap / (eth_balance * eth_price)
                nav_premium_pct = ((nav_multiplier - 1) * 100)
                
            if shares_outstanding > 0:
                eth_per_share = eth_balance / shares_outstanding
            
            # Store in database
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            # Store price history
            cursor.execute("""
                INSERT INTO price_history 
                (eth_price, stock_price, market_cap, eth_holdings, outstanding_shares)
                VALUES (?, ?, ?, ?, ?)
            """, (eth_price, stock_data["price"], market_cap, eth_balance, shares_outstanding))
            
            # Store calculated metrics
            cursor.execute("""
                INSERT INTO metrics 
                (nav_multiplier, eth_per_share, nav_premium_pct, treasury_value_usd)
                VALUES (?, ?, ?, ?)
            """, (nav_multiplier, eth_per_share, nav_premium_pct, treasury_value_usd))
            
            conn.commit()
            conn.close()
            
            print(f"Data collected: ETH=${eth_price:.2f}, Stock=${stock_data['price']:.2f}, Treasury={eth_balance:.2f}ETH")
            
        except Exception as e:
            print(f"Error in data collection: {e}")
    
    async def import_eth_csv_data(self, csv_file_path: str = "ETHUSD_1M_FROM_PERPLEXITY.csv"):
        """Import ETH historical data from CSV file into database"""
        try:
            if not os.path.exists(csv_file_path):
                print(f"CSV file not found: {csv_file_path}")
                return False
            
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            # Clear existing CSV data to avoid duplicates
            cursor.execute("DELETE FROM eth_historical_csv WHERE source = 'perplexity_csv'")
            
            # Read and process CSV
            with open(csv_file_path, 'r') as file:
                csv_reader = csv.DictReader(file)
                for row in csv_reader:
                    try:
                        # Parse the timestamp (assuming format: 2025-07-02 02:30:00)
                        timestamp = datetime.strptime(row['Date'], '%Y-%m-%d %H:%M:%S')
                        
                        cursor.execute("""
                            INSERT INTO eth_historical_csv 
                            (timestamp, open_price, high_price, low_price, close_price, volume, source)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (
                            timestamp,
                            float(row['Open']),
                            float(row['High']),
                            float(row['Low']),
                            float(row['Close']),
                            float(row['Volume']),
                            'perplexity_csv'
                        ))
                    except (ValueError, KeyError) as e:
                        print(f"Error processing row: {row}, Error: {e}")
                        continue
            
            conn.commit()
            
            # Get count of imported records
            cursor.execute("SELECT COUNT(*) FROM eth_historical_csv WHERE source = 'perplexity_csv'")
            count = cursor.fetchone()[0]
            
            conn.close()
            
            print(f"Successfully imported {count} ETH price records from CSV")
            return True
            
        except Exception as e:
            print(f"Error importing CSV data: {e}")
            return False
    
    async def get_eth_historical_from_csv(self, hours: int = 24) -> List[Dict]:
        """Get ETH historical data from imported CSV"""
        try:
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            # Get data from the last N hours
            cutoff_time = datetime.now() - timedelta(hours=hours)
            
            cursor.execute("""
                SELECT timestamp, open_price, high_price, low_price, close_price, volume
                FROM eth_historical_csv 
                WHERE timestamp >= ? AND source = 'perplexity_csv'
                ORDER BY timestamp ASC
            """, (cutoff_time,))
            
            rows = cursor.fetchall()
            conn.close()
            
            historical_data = []
            for row in rows:
                historical_data.append({
                    "timestamp": datetime.fromisoformat(row[0]),
                    "open": row[1],
                    "high": row[2],
                    "low": row[3],
                    "close": row[4],
                    "volume": row[5]
                })
            
            return historical_data
            
        except Exception as e:
            print(f"Error fetching CSV historical data: {e}")
            return []

    async def import_sbet_csv_data(self, csv_file_path: str = "SBET_1M_FROM_PERPLEXITY.csv"):
        """Import SBET historical stock data from CSV file into database"""
        try:
            if not os.path.exists(csv_file_path):
                print(f"SBET CSV file not found: {csv_file_path}")
                return False
            
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            # Clear existing SBET CSV data to avoid duplicates
            cursor.execute("DELETE FROM sbet_historical_csv WHERE source = 'perplexity_csv'")
            
            # Read and process CSV
            with open(csv_file_path, 'r') as file:
                csv_reader = csv.DictReader(file)
                for row in csv_reader:
                    try:
                        # Parse the timestamp (assuming format: 2025-07-01 15:30:00)
                        timestamp = datetime.strptime(row['Date'], '%Y-%m-%d %H:%M:%S')
                        
                        cursor.execute("""
                            INSERT INTO sbet_historical_csv 
                            (timestamp, open_price, high_price, low_price, close_price, volume, source)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (
                            timestamp,
                            float(row['Open']),
                            float(row['High']),
                            float(row['Low']),
                            float(row['Close']),
                            float(row['Volume']),
                            'perplexity_csv'
                        ))
                    except (ValueError, KeyError) as e:
                        print(f"Error processing SBET row: {row}, Error: {e}")
                        continue
            
            conn.commit()
            
            # Get count of imported records
            cursor.execute("SELECT COUNT(*) FROM sbet_historical_csv WHERE source = 'perplexity_csv'")
            count = cursor.fetchone()[0]
            
            conn.close()
            
            print(f"Successfully imported {count} SBET stock price records from CSV")
            return True
            
        except Exception as e:
            print(f"Error importing SBET CSV data: {e}")
            return False

    async def add_eth_purchase_transaction(self, timestamp: datetime, eth_quantity: float, 
                                         eth_price_usd: float, shares_outstanding: int,
                                         transaction_hash: str = None, notes: str = ""):
        """Add ETH purchase transaction and calculate concentration impact"""
        try:
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            # Get current ETH holdings before purchase
            cursor.execute("SELECT eth_holdings FROM price_history ORDER BY timestamp DESC LIMIT 1")
            result = cursor.fetchone()
            pre_purchase_holdings = result[0] if result else 0.0
            
            # Calculate new holdings and concentration
            post_purchase_holdings = pre_purchase_holdings + eth_quantity
            total_cost_usd = eth_quantity * eth_price_usd
            concentration_change = (eth_quantity / post_purchase_holdings) * 100 if post_purchase_holdings > 0 else 0
            
            # Insert purchase transaction
            cursor.execute("""
                INSERT INTO eth_purchase_transactions 
                (timestamp, transaction_hash, eth_quantity, eth_price_usd, total_cost_usd, 
                 shares_outstanding, pre_purchase_eth_holdings, post_purchase_eth_holdings, 
                 concentration_change_pct, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                timestamp, transaction_hash, eth_quantity, eth_price_usd, total_cost_usd,
                shares_outstanding, pre_purchase_holdings, post_purchase_holdings,
                concentration_change, notes
            ))
            
            conn.commit()
            conn.close()
            
            print(f"Added ETH purchase: {eth_quantity} ETH @ ${eth_price_usd} = ${total_cost_usd:,.2f}")
            return True
            
        except Exception as e:
            print(f"Error adding ETH purchase transaction: {e}")
            return False

    async def analyze_eth_concentration(self, timestamp: datetime = None):
        """Analyze current ETH concentration and treasury metrics"""
        try:
            if not timestamp:
                timestamp = datetime.now()
                
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            # Get latest data
            cursor.execute("""
                SELECT eth_holdings, stock_price, market_cap, outstanding_shares, eth_price
                FROM price_history 
                ORDER BY timestamp DESC LIMIT 1
            """)
            result = cursor.fetchone()
            
            if not result:
                return None
                
            eth_holdings, stock_price, market_cap, shares_outstanding, eth_price = result
            
            # Calculate concentration metrics
            treasury_value_usd = eth_holdings * eth_price
            eth_concentration_pct = (treasury_value_usd / market_cap) * 100 if market_cap > 0 else 0
            eth_per_share = eth_holdings / shares_outstanding if shares_outstanding > 0 else 0
            nav_multiplier = market_cap / treasury_value_usd if treasury_value_usd > 0 else 0
            
            # Store concentration analysis
            cursor.execute("""
                INSERT INTO eth_concentration_analysis 
                (timestamp, total_eth_holdings, market_cap_usd, eth_concentration_pct, 
                 treasury_value_usd, shares_outstanding, eth_per_share, nav_multiplier)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                timestamp, eth_holdings, market_cap, eth_concentration_pct,
                treasury_value_usd, shares_outstanding, eth_per_share, nav_multiplier
            ))
            
            conn.commit()
            conn.close()
            
            return {
                "timestamp": timestamp,
                "eth_holdings": eth_holdings,
                "market_cap": market_cap,
                "eth_concentration_pct": eth_concentration_pct,
                "treasury_value_usd": treasury_value_usd,
                "eth_per_share": eth_per_share,
                "nav_multiplier": nav_multiplier
            }
            
        except Exception as e:
            print(f"Error analyzing ETH concentration: {e}")
            return None

    async def get_sbet_historical_from_csv(self, hours: int = 24) -> List[Dict]:
        """Get SBET historical data from imported CSV"""
        try:
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            # Get data from the last N hours
            cutoff_time = datetime.now() - timedelta(hours=hours)
            
            cursor.execute("""
                SELECT timestamp, open_price, high_price, low_price, close_price, volume
                FROM sbet_historical_csv 
                WHERE timestamp >= ? AND source = 'perplexity_csv'
                ORDER BY timestamp ASC
            """, (cutoff_time,))
            
            rows = cursor.fetchall()
            conn.close()
            
            historical_data = []
            for row in rows:
                historical_data.append({
                    "timestamp": datetime.fromisoformat(row[0]),
                    "open": row[1],
                    "high": row[2],
                    "low": row[3],
                    "close": row[4],
                    "volume": row[5]
                })
            
            return historical_data
            
        except Exception as e:
            print(f"Error fetching SBET CSV historical data: {e}")
            return []

# Initialize data collector
data_collector = DataCollector()

# API Models
class CurrentMetrics(BaseModel):
    stock_price: float
    stock_change_pct: float
    market_cap: int
    eth_price: float
    eth_holdings: float
    treasury_value_usd: float
    nav_multiplier: float
    nav_premium_pct: float
    eth_per_share: float
    last_updated: datetime

@app.on_event("startup")
async def startup_event():
    """Initialize database and start background tasks on startup"""
    init_database()
    
    # Import CSV data on startup
    data_collector = DataCollector()
    await data_collector.import_eth_csv_data()
    await data_collector.import_sbet_csv_data()
    
    # Add sample ETH purchase transactions for demonstration
    await add_sample_eth_purchases()
    
    # Start the scheduler for real-time data collection
    scheduler = AsyncIOScheduler()
    
    async def collect_data_job():
        await data_collector.collect_and_store_data()
    
    # Schedule data collection every 5 minutes
    scheduler.add_job(collect_data_job, "interval", minutes=5)
    scheduler.start()

async def add_sample_eth_purchases():
    """Add real ETH purchase transactions based on SharpLink Gaming's actual treasury strategy"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Check if we already have purchase data
        cursor.execute("SELECT COUNT(*) FROM eth_purchase_transactions")
        count = cursor.fetchone()[0]
        
        if count > 0:
            conn.close()
            return  # Already have data
        
        # Real ETH purchase transactions based on SharpLink Gaming's actual acquisitions
        real_purchases = [
            {
                "timestamp": datetime(2025, 6, 13, 12, 0, 0),
                "eth_quantity": 176271.0,
                "eth_price_usd": 2626.0,
                "shares_outstanding": 72050000,  # Approximate based on $1B ATM facility
                "notes": "Major ETH acquisition - $463M purchase, becoming largest publicly-traded ETH holder"
            },
            {
                "timestamp": datetime(2025, 6, 26, 15, 30, 0),
                "eth_quantity": 9468.0,
                "eth_price_usd": 2411.0,
                "shares_outstanding": 72050000,
                "notes": "Additional ETH purchase - $22.8M acquisition via ATM facility proceeds"
            },
            {
                "timestamp": datetime(2025, 7, 1, 10, 0, 0),
                "eth_quantity": 222.0,
                "eth_price_usd": 0.0,  # Staking rewards, no cost
                "shares_outstanding": 72050000,
                "notes": "ETH staking rewards - Earned from 100% staked ETH holdings"
            },
            {
                "timestamp": datetime(2025, 7, 2, 14, 0, 0),
                "eth_quantity": 12206.0,
                "eth_price_usd": 2400.0,  # Estimated based on market conditions
                "shares_outstanding": 72050000,
                "notes": "Continued accumulation - Additional treasury expansion to reach 198,167 ETH total"
            }
        ]
        
        for purchase in real_purchases:
            # Calculate cumulative holdings
            cursor.execute("""
                SELECT COALESCE(SUM(eth_quantity), 0) 
                FROM eth_purchase_transactions 
                WHERE timestamp < ?
            """, (purchase["timestamp"],))
            pre_holdings = cursor.fetchone()[0]
            
            post_holdings = pre_holdings + purchase["eth_quantity"]
            total_cost = purchase["eth_quantity"] * purchase["eth_price_usd"]
            concentration_change = (purchase["eth_quantity"] / post_holdings) * 100 if post_holdings > 0 else 0
            
            cursor.execute("""
                INSERT INTO eth_purchase_transactions 
                (timestamp, eth_quantity, eth_price_usd, total_cost_usd, shares_outstanding,
                 pre_purchase_eth_holdings, post_purchase_eth_holdings, concentration_change_pct, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                purchase["timestamp"], purchase["eth_quantity"], purchase["eth_price_usd"],
                total_cost, purchase["shares_outstanding"], pre_holdings, post_holdings,
                concentration_change, purchase["notes"]
            ))
        
        conn.commit()
        conn.close()
        print(f"Added {len(real_purchases)} real ETH purchase transactions")
        
    except Exception as e:
        print(f"Error adding sample ETH purchases: {e}")

@app.get("/")
async def root():
    return {"message": "Sharplink ETH Treasury Tracker API"}

@app.get("/api/current-metrics", response_model=CurrentMetrics)
async def get_current_metrics():
    """Get current real-time metrics"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Get latest data
        cursor.execute("""
            SELECT ph.eth_price, ph.stock_price, ph.market_cap, ph.eth_holdings, ph.outstanding_shares,
                   m.nav_multiplier, m.eth_per_share, m.nav_premium_pct, m.treasury_value_usd,
                   ph.timestamp
            FROM price_history ph
            JOIN metrics m ON ph.id = m.id
            ORDER BY ph.timestamp DESC
            LIMIT 1
        """)
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            raise HTTPException(status_code=404, detail="No data available")
        
        # Calculate daily change (simplified for MVP)
        stock_change_pct = 0.0  # Would need historical comparison
        
        return CurrentMetrics(
            stock_price=result[1],
            stock_change_pct=stock_change_pct,
            market_cap=result[2],
            eth_price=result[0],
            eth_holdings=result[3],
            treasury_value_usd=result[8],
            nav_multiplier=result[5],
            nav_premium_pct=result[7],
            eth_per_share=result[6],
            last_updated=datetime.fromisoformat(result[9])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/price-history")
async def get_price_history(timeframe: str = "1M"):
    """Get historical price data for charts"""
    try:
        # Map timeframe to days
        timeframe_days = {
            "1D": 1,
            "1W": 7,
            "1M": 30,
            "3M": 90,
            "1Y": 365
        }
        
        days = timeframe_days.get(timeframe, 30)
        cutoff_date = datetime.now() - timedelta(days=days)
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT timestamp, eth_price, stock_price, market_cap, eth_holdings
            FROM price_history
            WHERE timestamp > ?
            ORDER BY timestamp
        """, (cutoff_date,))
        
        results = cursor.fetchall()
        conn.close()
        
        data = []
        for row in results:
            data.append({
                "timestamp": row[0],
                "eth_price": row[1],
                "stock_price": row[2],
                "market_cap": row[3],
                "eth_holdings": row[4]
            })
        
        return {"data": data, "timeframe": timeframe}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nav-multiplier")
async def get_nav_multiplier_data(timeframe: str = "1M"):
    """Get NAV multiplier chart data"""
    try:
        timeframe_days = {
            "1D": 1,
            "1W": 7,
            "1M": 30,
            "3M": 90,
            "1Y": 365
        }
        
        days = timeframe_days.get(timeframe, 30)
        cutoff_date = datetime.now() - timedelta(days=days)
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT ph.timestamp, ph.eth_price, m.nav_multiplier
            FROM price_history ph
            JOIN metrics m ON ph.id = m.id
            WHERE ph.timestamp > ?
            ORDER BY ph.timestamp
        """, (cutoff_date,))
        
        results = cursor.fetchall()
        conn.close()
        
        data = []
        for row in results:
            data.append({
                "timestamp": row[0],
                "eth_price": row[1],
                "nav_multiplier": row[2]
            })
        
        return {"data": data, "timeframe": timeframe}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/performance-comparison")
async def get_performance_comparison(period: str = "1Y"):
    """Get performance comparison data"""
    try:
        # This would typically require more complex calculations
        # For MVP, returning simplified data structure
        
        timeframe_days = {
            "1M": 30,
            "3M": 90,
            "1Y": 365
        }
        
        days = timeframe_days.get(period, 365)
        cutoff_date = datetime.now() - timedelta(days=days)
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT timestamp, stock_price, eth_price
            FROM price_history
            WHERE timestamp > ?
            ORDER BY timestamp
        """, (cutoff_date,))
        
        results = cursor.fetchall()
        conn.close()
        
        if not results:
            return {"data": [], "period": period}
        
        # Calculate normalized performance (base 100)
        initial_stock_price = results[0][1]
        initial_eth_price = results[0][2]
        
        data = []
        for row in results:
            stock_performance = (row[1] / initial_stock_price) * 100 if initial_stock_price > 0 else 100
            eth_performance = (row[2] / initial_eth_price) * 100 if initial_eth_price > 0 else 100
            
            data.append({
                "timestamp": row[0],
                "sharplink_performance": stock_performance,
                "eth_performance": eth_performance
            })
        
        return {"data": data, "period": period}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/treasury-stats")
async def get_treasury_stats():
    """Get treasury statistics and holdings over time"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Get latest treasury data
        cursor.execute("""
            SELECT eth_holdings, treasury_value_usd, timestamp
            FROM metrics m
            JOIN price_history ph ON m.id = ph.id
            ORDER BY timestamp DESC
            LIMIT 1
        """)
        
        latest = cursor.fetchone()
        
        # Get historical treasury data (last 30 days)
        cutoff_date = datetime.now() - timedelta(days=30)
        cursor.execute("""
            SELECT ph.timestamp, ph.eth_holdings, m.treasury_value_usd
            FROM price_history ph
            JOIN metrics m ON ph.id = m.id
            WHERE ph.timestamp > ?
            ORDER BY ph.timestamp
        """, (cutoff_date,))
        
        historical = cursor.fetchall()
        conn.close()
        
        current_stats = {
            "current_eth_holdings": latest[0] if latest else 0,
            "current_value_usd": latest[1] if latest else 0,
            "last_updated": latest[2] if latest else None
        }
        
        historical_data = []
        for row in historical:
            historical_data.append({
                "timestamp": row[0],
                "eth_holdings": row[1],
                "value_usd": row[2]
            })
        
        return {
            "current": current_stats,
            "historical": historical_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

@app.get("/api/eth-historical-csv")
async def get_eth_historical_csv_data(timeframe: str = "24H"):
    """
    Get ETH historical data from CSV file
    Timeframes: 1H, 6H, 12H, 24H, 3D, 1W, 1M
    """
    try:
        # Map timeframes to hours
        timeframe_hours = {
            "1H": 1,
            "6H": 6, 
            "12H": 12,
            "24H": 24,
            "3D": 72,
            "1W": 168,
            "1M": 720  # 30 days
        }
        
        hours = timeframe_hours.get(timeframe, 24)
        
        data_collector = DataCollector()
        historical_data = await data_collector.get_eth_historical_from_csv(hours)
        
        if not historical_data:
            return {"error": "No historical data available", "data": []}
        
        # Format data for charts
        formatted_data = []
        for item in historical_data:
            formatted_data.append({
                "timestamp": item["timestamp"].isoformat(),
                "price": item["close"],
                "open": item["open"],
                "high": item["high"],
                "low": item["low"],
                "volume": item["volume"]
            })
        
        return {
            "timeframe": timeframe,
            "data_source": "perplexity_csv",
            "data_points": len(formatted_data),
            "data": formatted_data
        }
        
    except Exception as e:
        print(f"Error in get_eth_historical_csv_data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/price-history-enhanced")
async def get_enhanced_price_history(timeframe: str = "1M", source: str = "auto"):
    """
    Enhanced price history combining CSV data with API data
    Sources: csv, api, auto (csv first, fallback to api)
    """
    try:
        data_collector = DataCollector()
        
        # Try CSV data first if available
        if source in ["csv", "auto"]:
            timeframe_hours = {
                "1H": 1, "6H": 6, "12H": 12, "24H": 24,
                "3D": 72, "1W": 168, "1M": 720
            }
            
            hours = timeframe_hours.get(timeframe, 24)
            csv_data = await data_collector.get_eth_historical_from_csv(hours)
            
            if csv_data and source == "csv":
                return {
                    "timeframe": timeframe,
                    "source": "csv",
                    "data": [{"timestamp": item["timestamp"].isoformat(), "price": item["close"]} for item in csv_data]
                }
            elif csv_data and source == "auto":
                return {
                    "timeframe": timeframe,
                    "source": "csv_primary",
                    "data": [{"timestamp": item["timestamp"].isoformat(), "price": item["close"]} for item in csv_data]
                }
        
        # Fallback to API data
        if source in ["api", "auto"]:
            # Get from existing price_history table
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            timeframe_hours = {"1H": 1, "6H": 6, "12H": 12, "24H": 24, "3D": 72, "1W": 168, "1M": 720}
            hours = timeframe_hours.get(timeframe, 24)
            cutoff_time = datetime.now() - timedelta(hours=hours)
            
            cursor.execute("""
                SELECT timestamp, eth_price 
                FROM price_history 
                WHERE timestamp >= ? AND eth_price > 0
                ORDER BY timestamp ASC
            """, (cutoff_time,))
            
            rows = cursor.fetchall()
            conn.close()
            
            api_data = [{"timestamp": row[0], "price": row[1]} for row in rows]
            
            return {
                "timeframe": timeframe,
                "source": "api_fallback" if source == "auto" else "api", 
                "data": api_data
            }
        
        return {"error": "No data available", "data": []}
        
    except Exception as e:
        print(f"Error in get_enhanced_price_history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/import-csv")
async def import_csv_data(csv_filename: str = "ETHUSD_1M_FROM_PERPLEXITY.csv"):
    """Import CSV data endpoint"""
    try:
        result = await data_collector.import_eth_csv_data(csv_filename)
        if result:
            return {"message": f"Successfully imported CSV data from {csv_filename}"}
        else:
            raise HTTPException(status_code=400, detail="Failed to import CSV data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sbet-historical-csv")
async def get_sbet_historical_csv_data(timeframe: str = "24H"):
    """Get SBET historical stock data from CSV"""
    try:
        # Map timeframe to hours
        timeframe_hours = {
            "1H": 1,
            "6H": 6, 
            "24H": 24,
            "7D": 168,
            "30D": 720
        }
        
        hours = timeframe_hours.get(timeframe, 24)
        data = await data_collector.get_sbet_historical_from_csv(hours)
        
        if not data:
            raise HTTPException(status_code=404, detail="No SBET CSV data available")
        
        # Process data for frontend
        processed_data = []
        for item in data:
            processed_data.append({
                "timestamp": item["timestamp"].isoformat(),
                "open": item["open"],
                "high": item["high"], 
                "low": item["low"],
                "close": item["close"],
                "volume": item["volume"]
            })
        
        return {
            "data": processed_data,
            "timeframe": timeframe,
            "data_source": "sbet_csv",
            "total_records": len(processed_data),
            "message": f"SBET historical data for {timeframe}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/eth-purchases")
async def get_eth_purchase_transactions(timeframe: str = "30D"):
    """Get ETH purchase transaction history"""
    try:
        # Map timeframe to days
        timeframe_days = {
            "7D": 7,
            "30D": 30,
            "90D": 90,
            "1Y": 365,
            "ALL": 9999
        }
        
        days = timeframe_days.get(timeframe, 30)
        cutoff_date = datetime.now() - timedelta(days=days)
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT timestamp, eth_quantity, eth_price_usd, total_cost_usd, 
                   pre_purchase_eth_holdings, post_purchase_eth_holdings,
                   concentration_change_pct, notes
            FROM eth_purchase_transactions
            WHERE timestamp >= ?
            ORDER BY timestamp DESC
        """, (cutoff_date,))
        
        results = cursor.fetchall()
        conn.close()
        
        purchase_history = []
        total_eth_purchased = 0
        total_cost = 0
        
        for row in results:
            purchase_data = {
                "timestamp": row[0],
                "eth_quantity": row[1],
                "eth_price_usd": row[2],
                "total_cost_usd": row[3],
                "pre_purchase_holdings": row[4],
                "post_purchase_holdings": row[5],
                "concentration_change_pct": row[6],
                "notes": row[7]
            }
            purchase_history.append(purchase_data)
            total_eth_purchased += row[1]
            total_cost += row[3]
        
        # Calculate average purchase price
        avg_purchase_price = total_cost / total_eth_purchased if total_eth_purchased > 0 else 0
        
        return {
            "purchases": purchase_history,
            "summary": {
                "total_purchases": len(purchase_history),
                "total_eth_purchased": total_eth_purchased,
                "total_cost_usd": total_cost,
                "average_purchase_price": avg_purchase_price,
                "timeframe": timeframe
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/eth-concentration")
async def get_eth_concentration_analysis(timeframe: str = "30D"):
    """Get ETH concentration analysis over time"""
    try:
        # Map timeframe to days
        timeframe_days = {
            "7D": 7,
            "30D": 30,
            "90D": 90,
            "1Y": 365
        }
        
        days = timeframe_days.get(timeframe, 30)
        cutoff_date = datetime.now() - timedelta(days=days)
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Get concentration analysis data
        cursor.execute("""
            SELECT timestamp, total_eth_holdings, market_cap_usd, eth_concentration_pct,
                   treasury_value_usd, eth_per_share, nav_multiplier
            FROM eth_concentration_analysis
            WHERE timestamp >= ?
            ORDER BY timestamp ASC
        """, (cutoff_date,))
        
        results = cursor.fetchall()
        
        # If no concentration data, calculate it from current data
        if not results:
            analysis = await data_collector.analyze_eth_concentration()
            if analysis:
                results = [(
                    analysis["timestamp"], analysis["eth_holdings"], analysis["market_cap"],
                    analysis["eth_concentration_pct"], analysis["treasury_value_usd"],
                    analysis["eth_per_share"], analysis["nav_multiplier"]
                )]
        
        conn.close()
        
        concentration_data = []
        for row in results:
            concentration_data.append({
                "timestamp": row[0],
                "total_eth_holdings": row[1],
                "market_cap_usd": row[2],
                "eth_concentration_pct": row[3],
                "treasury_value_usd": row[4],
                "eth_per_share": row[5],
                "nav_multiplier": row[6]
            })
        
        # Calculate concentration metrics summary
        if concentration_data:
            latest = concentration_data[-1]
            earliest = concentration_data[0] if len(concentration_data) > 1 else latest
            
            concentration_change = latest["eth_concentration_pct"] - earliest["eth_concentration_pct"]
            holdings_growth = ((latest["total_eth_holdings"] - earliest["total_eth_holdings"]) / earliest["total_eth_holdings"]) * 100 if earliest["total_eth_holdings"] > 0 else 0
        else:
            latest = None
            concentration_change = 0
            holdings_growth = 0
        
        return {
            "concentration_history": concentration_data,
            "current_metrics": latest,
            "summary": {
                "timeframe": timeframe,
                "concentration_change_pct": concentration_change,
                "holdings_growth_pct": holdings_growth,
                "data_points": len(concentration_data)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/treasury-dashboard")
async def get_treasury_dashboard_data():
    """Get comprehensive treasury dashboard data combining SBET and ETH information"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Get latest SBET price data
        cursor.execute("""
            SELECT timestamp, close_price, volume
            FROM sbet_historical_csv
            ORDER BY timestamp DESC
            LIMIT 1
        """)
        sbet_latest = cursor.fetchone()
        
        # Get latest ETH price data  
        cursor.execute("""
            SELECT timestamp, close_price
            FROM eth_historical_csv
            ORDER BY timestamp DESC
            LIMIT 1
        """)
        eth_latest = cursor.fetchone()
        
        # Get total ETH purchases
        cursor.execute("""
            SELECT SUM(eth_quantity), SUM(total_cost_usd), AVG(eth_price_usd)
            FROM eth_purchase_transactions
        """)
        eth_summary = cursor.fetchone()
        
        # Get latest concentration analysis
        cursor.execute("""
            SELECT eth_concentration_pct, treasury_value_usd, nav_multiplier, eth_per_share
            FROM eth_concentration_analysis
            ORDER BY timestamp DESC
            LIMIT 1
        """)
        concentration_latest = cursor.fetchone()
        
        conn.close()
        
        # Calculate key metrics
        total_eth_holdings = eth_summary[0] if eth_summary[0] else 0
        total_investment_usd = eth_summary[1] if eth_summary[1] else 0
        avg_purchase_price = eth_summary[2] if eth_summary[2] else 0
        current_eth_price = eth_latest[1] if eth_latest else 0
        current_sbet_price = sbet_latest[1] if sbet_latest else 0
        
        # Calculate unrealized gains/losses
        current_eth_value = total_eth_holdings * current_eth_price
        unrealized_pnl = current_eth_value - total_investment_usd
        unrealized_pnl_pct = (unrealized_pnl / total_investment_usd) * 100 if total_investment_usd > 0 else 0
        
        return {
            "sbet_stock": {
                "current_price": current_sbet_price,
                "last_updated": sbet_latest[0] if sbet_latest else None,
                "volume": sbet_latest[2] if sbet_latest else 0
            },
            "eth_treasury": {
                "total_holdings": total_eth_holdings,
                "current_value_usd": current_eth_value,
                "total_invested_usd": total_investment_usd,
                "average_purchase_price": avg_purchase_price,
                "current_eth_price": current_eth_price,
                "unrealized_pnl_usd": unrealized_pnl,
                "unrealized_pnl_pct": unrealized_pnl_pct
            },
            "concentration_metrics": {
                "eth_concentration_pct": concentration_latest[0] if concentration_latest else 0,
                "treasury_value_usd": concentration_latest[1] if concentration_latest else 0,
                "nav_multiplier": concentration_latest[2] if concentration_latest else 0,
                "eth_per_share": concentration_latest[3] if concentration_latest else 0
            },
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/import-sbet-csv")
async def import_sbet_csv_data(csv_filename: str = "SBET_1M_FROM_PERPLEXITY.csv"):
    """Import SBET CSV data endpoint"""
    try:
        result = await data_collector.import_sbet_csv_data(csv_filename)
        if result:
            return {"message": f"Successfully imported SBET CSV data from {csv_filename}"}
        else:
            raise HTTPException(status_code=400, detail="Failed to import SBET CSV data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 