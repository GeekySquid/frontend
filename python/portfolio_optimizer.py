"""
Portfolio Analysis & Optimization Service
Uses PyPortfolioOpt for optimal portfolio allocation and prediction
"""

import yfinance as yf
import pandas as pd
from pypfopt.efficient_frontier import EfficientFrontier
from pypfopt import risk_models, expected_returns
import json
import sys
from datetime import datetime, timedelta

def fetch_portfolio_data(tickers, start_date, end_date):
    """Fetch historical data for portfolio tickers"""
    try:
        data = yf.download(tickers, start=start_date, end=end_date, progress=False)['Adj Close']
        return data
    except Exception as e:
        print(json.dumps({"error": f"Failed to fetch data: {str(e)}"}))
        sys.exit(1)

def optimize_portfolio(tickers, start_date=None, end_date=None):
    """
    Optimize portfolio for maximum Sharpe ratio
    Returns optimal weights and performance metrics
    """
    if not start_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=730)).strftime("%Y-%m-%d")
    
    # Fetch data
    data = fetch_portfolio_data(tickers, start_date, end_date)
    
    if data.empty:
        return {"error": "No data available for the given tickers"}
    
    # Calculate expected returns and covariance matrix
    mu = expected_returns.mean_historical_return(data)
    S = risk_models.sample_cov(data)
    
    # Optimize for Maximum Sharpe Ratio
    ef = EfficientFrontier(mu, S)
    weights = ef.max_sharpe()
    cleaned_weights = ef.clean_weights()
    
    # Get performance metrics
    performance = ef.portfolio_performance(verbose=False)
    
    result = {
        "optimal_weights": cleaned_weights,
        "expected_annual_return": round(performance[0] * 100, 2),
        "annual_volatility": round(performance[1] * 100, 2),
        "sharpe_ratio": round(performance[2], 2),
        "tickers": tickers,
        "analysis_period": {
            "start": start_date,
            "end": end_date
        }
    }
    
    return result

def predict_portfolio_performance(tickers, investment_amount=10000):
    """
    Predict future portfolio performance based on historical data
    """
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=730)).strftime("%Y-%m-%d")
    
    # Get optimal portfolio
    optimization = optimize_portfolio(tickers, start_date, end_date)
    
    if "error" in optimization:
        return optimization
    
    # Fetch recent data for prediction
    data = fetch_portfolio_data(tickers, start_date, end_date)
    
    # Calculate individual stock metrics
    stock_analysis = {}
    for ticker in tickers:
        if ticker in data.columns:
            stock_data = data[ticker].dropna()
            returns = stock_data.pct_change().dropna()
            
            stock_analysis[ticker] = {
                "current_price": round(stock_data.iloc[-1], 2),
                "avg_return": round(returns.mean() * 252 * 100, 2),  # Annualized
                "volatility": round(returns.std() * (252 ** 0.5) * 100, 2),
                "optimal_weight": optimization["optimal_weights"].get(ticker, 0),
                "recommended_allocation": round(investment_amount * optimization["optimal_weights"].get(ticker, 0), 2)
            }
    
    # Calculate projected returns
    expected_return = optimization["expected_annual_return"]
    projected_1year = round(investment_amount * (1 + expected_return / 100), 2)
    projected_3year = round(investment_amount * ((1 + expected_return / 100) ** 3), 2)
    projected_5year = round(investment_amount * ((1 + expected_return / 100) ** 5), 2)
    
    result = {
        "portfolio_optimization": optimization,
        "stock_analysis": stock_analysis,
        "investment_projections": {
            "initial_investment": investment_amount,
            "projected_1year": projected_1year,
            "projected_3year": projected_3year,
            "projected_5year": projected_5year,
            "gain_1year": round(projected_1year - investment_amount, 2),
            "gain_3year": round(projected_3year - investment_amount, 2),
            "gain_5year": round(projected_5year - investment_amount, 2)
        },
        "risk_assessment": {
            "risk_level": "High" if optimization["annual_volatility"] > 25 else "Medium" if optimization["annual_volatility"] > 15 else "Low",
            "diversification_score": round(len([w for w in optimization["optimal_weights"].values() if w > 0.05]) / len(tickers) * 100, 2)
        },
        "recommendations": generate_recommendations(optimization, stock_analysis)
    }
    
    return result

def generate_recommendations(optimization, stock_analysis):
    """Generate investment recommendations based on analysis"""
    recommendations = []
    
    # Sharpe ratio recommendation
    sharpe = optimization["sharpe_ratio"]
    if sharpe > 1.5:
        recommendations.append("Excellent risk-adjusted returns. Strong portfolio allocation.")
    elif sharpe > 1.0:
        recommendations.append("Good risk-adjusted returns. Portfolio is well-balanced.")
    else:
        recommendations.append("Consider diversifying to improve risk-adjusted returns.")
    
    # Volatility recommendation
    volatility = optimization["annual_volatility"]
    if volatility > 25:
        recommendations.append("High volatility detected. Consider adding stable assets to reduce risk.")
    elif volatility < 15:
        recommendations.append("Low volatility portfolio. Suitable for conservative investors.")
    
    # Concentration recommendation
    weights = optimization["optimal_weights"]
    max_weight = max(weights.values())
    if max_weight > 0.4:
        recommendations.append(f"Portfolio is concentrated in one asset ({max_weight*100:.1f}%). Consider diversifying.")
    
    # Individual stock recommendations
    for ticker, analysis in stock_analysis.items():
        if analysis["optimal_weight"] > 0.3:
            recommendations.append(f"{ticker}: High allocation recommended ({analysis['optimal_weight']*100:.1f}%). Strong performer.")
        elif analysis["optimal_weight"] < 0.05:
            recommendations.append(f"{ticker}: Low allocation ({analysis['optimal_weight']*100:.1f}%). Consider alternatives.")
    
    return recommendations

if __name__ == "__main__":
    # Read input from command line arguments
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No tickers provided"}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "optimize":
        tickers = sys.argv[2].split(",")
        result = optimize_portfolio(tickers)
        print(json.dumps(result))
    
    elif command == "predict":
        tickers = sys.argv[2].split(",")
        investment = float(sys.argv[3]) if len(sys.argv) > 3 else 10000
        result = predict_portfolio_performance(tickers, investment)
        print(json.dumps(result))
    
    else:
        print(json.dumps({"error": "Invalid command. Use 'optimize' or 'predict'"}))
        sys.exit(1)
