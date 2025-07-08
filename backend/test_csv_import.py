#!/usr/bin/env python3
"""
Test script to verify CSV import functionality
"""
import asyncio
import sqlite3
import os
from main import DataCollector, init_database

async def test_csv_import():
    """Test the CSV import functionality"""
    print("🧪 Testing CSV Import Functionality")
    print("=" * 50)
    
    # Initialize database
    print("1. Initializing database...")
    init_database()
    print("✅ Database initialized")
    
    # Create data collector
    print("2. Creating data collector...")
    collector = DataCollector()
    print("✅ Data collector created")
    
    # Test CSV file exists
    csv_path = "ETHUSD_1M_FROM_PERPLEXITY.csv"
    if os.path.exists(csv_path):
        print(f"✅ CSV file found: {csv_path}")
    else:
        print(f"❌ CSV file not found: {csv_path}")
        return False
    
    # Import CSV data
    print("3. Importing CSV data...")
    success = await collector.import_eth_csv_data(csv_path)
    
    if success:
        print("✅ CSV data imported successfully")
    else:
        print("❌ CSV import failed")
        return False
    
    # Verify data in database
    print("4. Verifying data in database...")
    conn = sqlite3.connect("treasury_tracker.db")
    cursor = conn.cursor()
    
    # Check total records
    cursor.execute("SELECT COUNT(*) FROM eth_historical_csv WHERE source = 'perplexity_csv'")
    total_records = cursor.fetchone()[0]
    print(f"📊 Total records imported: {total_records}")
    
    # Check date range
    cursor.execute("""
        SELECT MIN(timestamp), MAX(timestamp) 
        FROM eth_historical_csv 
        WHERE source = 'perplexity_csv'
    """)
    date_range = cursor.fetchone()
    print(f"📅 Date range: {date_range[0]} to {date_range[1]}")
    
    # Check price range
    cursor.execute("""
        SELECT MIN(close_price), MAX(close_price), AVG(close_price)
        FROM eth_historical_csv 
        WHERE source = 'perplexity_csv'
    """)
    price_stats = cursor.fetchone()
    print(f"💰 Price range: ${price_stats[0]:.2f} - ${price_stats[1]:.2f} (avg: ${price_stats[2]:.2f})")
    
    # Sample some records
    cursor.execute("""
        SELECT timestamp, close_price 
        FROM eth_historical_csv 
        WHERE source = 'perplexity_csv'
        ORDER BY timestamp DESC 
        LIMIT 5
    """)
    sample_records = cursor.fetchall()
    print("\n📈 Latest 5 price points:")
    for record in sample_records:
        print(f"  {record[0]}: ${record[1]:.2f}")
    
    conn.close()
    
    # Test data retrieval
    print("\n5. Testing data retrieval...")
    historical_data = await collector.get_eth_historical_from_csv(24)  # Last 24 hours
    print(f"📈 Retrieved {len(historical_data)} data points for last 24 hours")
    
    if historical_data:
        latest = historical_data[-1]
        print(f"🔥 Latest data point: {latest['timestamp']} - ${latest['close']:.2f}")
        print("✅ Data retrieval test passed")
    else:
        print("⚠️  No data retrieved for last 24 hours (might be expected if CSV is older)")
    
    print("\n" + "=" * 50)
    print("🎉 All tests completed successfully!")
    return True

async def test_api_endpoints():
    """Test the API endpoints (requires server to be running)"""
    print("\n🌐 Testing API Endpoints")
    print("=" * 50)
    
    try:
        import requests
        
        # Test the CSV historical endpoint
        response = requests.get("http://localhost:8000/api/eth-historical-csv?timeframe=24H")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ CSV endpoint: {data['data_points']} data points")
        else:
            print(f"❌ CSV endpoint failed: {response.status_code}")
        
        # Test the enhanced price history endpoint
        response = requests.get("http://localhost:8000/api/price-history-enhanced?timeframe=24H&source=csv")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Enhanced endpoint: {data['source']} source")
        else:
            print(f"❌ Enhanced endpoint failed: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("⚠️  Server not running. Start with: cd backend && python main.py")
    except ImportError:
        print("⚠️  requests library not installed. Install with: pip install requests")

if __name__ == "__main__":
    print("🚀 Starting CSV Import Tests")
    
    # Change to backend directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Run async tests
    success = asyncio.run(test_csv_import())
    
    if success:
        asyncio.run(test_api_endpoints()) 