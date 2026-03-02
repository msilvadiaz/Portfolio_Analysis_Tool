# Portfolio Analysis Tool — System Overview

## 1. Purpose

This project is a full-stack web application for managing stock portfolios and performing quantitative portfolio analysis. It allows users to track holdings, evaluate performance over time, and generate optimization insights based on historical market data.

---

## 2. System Architecture

The system follows a client–server architecture composed of:

### Frontend

- Built with **React, TypeScript, and Vite**
- Provides interactive dashboards for portfolio management and analytics
- Supports both guest usage (temporary data) and registered user profiles

### Backend

- Built with **Flask and SQLAlchemy**
- Exposes REST APIs for data management and analytics
- Handles portfolio storage, calculations, and model execution

### Database

- Uses **PostgreSQL** for persistent storage of user profiles and holdings
- Connection configured via the `DATABASE_URL` environment variable

### External Data Source

- Market prices and historical data retrieved from **Yahoo Finance (yfinance)**

---

## 3. Functional Capabilities

### Portfolio Management

- Create and manage user profiles
- Add and remove stock holdings
- Retrieve real-time price quotes
- Compute current portfolio value

### Historical Analysis

- Generate time-series portfolio value over a selected period
- Aggregate holdings by ticker for analysis
- Support both saved users and guest portfolios

### Quantitative Models

- Efficient frontier simulation using Monte Carlo methods
- Portfolio optimization based on selected objectives (e.g., maximum Sharpe ratio)
- Rebalancing recommendations indicating buy, sell, or hold actions

---

## 4. API Interface

The backend exposes REST endpoints for:

- User and portfolio management
- Stock operations
- Historical performance retrieval
- Quantitative model execution

All endpoints are accessible under the `/api` path.

---

## 5. Data Handling and Caching

- Portfolio data for registered users is stored in the database
- Guest data exists only in memory during the session
- Historical portfolio results are cached temporarily to improve performance
- Cache is invalidated when portfolio data changes

---

## 6. Configuration Requirements

### Backend Environment Variable

- `DATABASE_URL` — PostgreSQL connection string

### Frontend Environment Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 7. Deployment Notes

- Frontend and backend can be deployed independently
- Cross-Origin Resource Sharing (CORS) is enabled for API endpoints
- The system is designed to support future expansion of analytics models and asset classes

---

## 8. Summary

This application provides an integrated platform for portfolio tracking and quantitative analysis, combining persistent storage, real-time market data, and advanced financial modeling within a modern web architecture.
