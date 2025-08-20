from flask import Flask, render_template
import yfinance as yf
from datetime import datetime

app = Flask(__name__)

# Data provided by the user
eth_holdings_data = [
    {"date": "2025-06-13", "eth": 176270.69},
    {"date": "2025-07-01", "eth": 198167},
    {"date": "2025-07-08", "eth": 205634},
    {"date": "2025-07-13", "eth": 280706},
    {"date": "2025-07-20", "eth": 360807},
    {"date": "2025-08-05", "eth": 521939},
    {"date": "2025-08-10", "eth": 598800},
    {"date": "2025-08-15", "eth": 728804},
    {"date": "2025-08-17", "eth": 740760},
]

DILUTED_SHARES = 191411370

@app.route('/')
def index():
    # Get live data
    sbet_ticker = yf.Ticker("SBET")
    eth_ticker = yf.Ticker("ETH-USD")

    sbet_price = sbet_ticker.history(period="1d")['Close'].iloc[-1]
    eth_price = eth_ticker.history(period="1d")['Close'].iloc[-1]

    latest_eth_holding = eth_holdings_data[-1]["eth"]

    # Calculations
    eth_per_share = latest_eth_holding / DILUTED_SHARES
    treasury_value_per_share = eth_per_share * eth_price
    mnav = sbet_price / treasury_value_per_share if treasury_value_per_share > 0 else 0
    eth_concentration = (treasury_value_per_share / sbet_price) * 100 if sbet_price > 0 else 0


    # Projected prices
    projected_prices = {
        "1x": treasury_value_per_share * 1,
        "2x": treasury_value_per_share * 2,
        "4x": treasury_value_per_share * 4,
    }

    # Format data for the chart
    chart_labels = [item['date'] for item in eth_holdings_data]
    chart_data = [item['eth'] for item in eth_holdings_data]

    return render_template('index.html',
                           sbet_price=f"{sbet_price:,.2f}",
                           eth_price=f"{eth_price:,.2f}",
                           latest_eth_holding=f"{latest_eth_holding:,.0f}",
                           mnav=f"{mnav:,.2f}",
                           eth_concentration=f"{eth_concentration:,.2f}",
                           projected_prices=projected_prices,
                           chart_labels=chart_labels,
                           chart_data=chart_data,
                           last_updated=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"))

if __name__ == '__main__':
    app.run(debug=True, port=5001)
