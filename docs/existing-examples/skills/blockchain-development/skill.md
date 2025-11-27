# Blockchain Development Skill

Advanced blockchain and Web3 development expertise covering smart contracts, DeFi protocols, NFT systems, and decentralized application architecture.

## Skill Overview

Expert blockchain development knowledge including Solidity smart contracts, Ethereum ecosystem, Layer 2 solutions, DeFi protocols, NFT platforms, Web3 integration, and modern blockchain security practices.

## Core Capabilities

### Smart Contract Development
- **Solidity mastery** - Advanced patterns, gas optimization, security best practices
- **Smart contract testing** - Hardhat, Foundry, comprehensive test suites
- **Contract verification** - Etherscan verification, formal verification methods
- **Upgrade patterns** - Proxy patterns, diamond standard, safe upgrades

### DeFi Protocol Development
- **Automated Market Makers** - Uniswap-style DEX implementations
- **Lending protocols** - Aave/Compound-style lending platforms
- **Yield farming** - Staking mechanisms, reward distribution, tokenomics
- **Cross-chain protocols** - Bridge development, multi-chain interactions

### NFT & Digital Assets
- **NFT standards** - ERC-721, ERC-1155, advanced metadata standards
- **Marketplace development** - OpenSea-style platforms, royalty systems
- **Dynamic NFTs** - Chainlink integration, evolving metadata
- **Fractional ownership** - NFT fractionalization, liquid ownership

### Web3 Integration
- **Frontend integration** - ethers.js, web3.js, wagmi, RainbowKit
- **Wallet integration** - MetaMask, WalletConnect, multi-wallet support
- **IPFS integration** - Distributed storage, metadata hosting
- **The Graph** - Subgraph development, efficient data querying

## Advanced Blockchain Development

### Comprehensive DeFi Protocol
```solidity
// Advanced DeFi lending protocol with modern security patterns
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title AdvancedLendingProtocol
 * @dev Advanced DeFi lending protocol with dynamic interest rates,
 *      liquidations, and cross-asset collateral support
 */
contract AdvancedLendingProtocol is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Constants
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_UTILIZATION_RATE = 95e16; // 95%
    uint256 public constant LIQUIDATION_THRESHOLD = 75e16; // 75%
    uint256 public constant LIQUIDATION_BONUS = 5e16; // 5%

    // Structs
    struct Market {
        IERC20 token;
        AggregatorV3Interface priceOracle;
        uint256 totalSupply;
        uint256 totalBorrows;
        uint256 reserveFactor;
        uint256 collateralFactor;
        uint256 baseInterestRate;
        uint256 multiplier;
        uint256 jumpMultiplier;
        uint256 kink;
        uint256 lastUpdateTimestamp;
        uint256 borrowIndex;
        uint256 supplyIndex;
        bool isListed;
        bool canBorrow;
        bool canCollateralize;
    }

    struct UserAccount {
        mapping(address => uint256) balances; // cToken balances
        mapping(address => uint256) borrowBalances;
        mapping(address => uint256) borrowIndex;
        address[] assetsIn;
        bool isLiquidatable;
    }

    // State variables
    mapping(address => Market) public markets;
    mapping(address => UserAccount) public userAccounts;
    mapping(address => bool) public isMarketListed;

    address[] public allMarkets;
    uint256 public closeFactorMantissa = 50e16; // 50%
    uint256 public protocolSeizeShareMantissa = 2.8e16; // 2.8%

    // Events
    event MarketListed(address indexed token, address indexed oracle);
    event Supply(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, uint256 amount);
    event Borrow(address indexed user, address indexed token, uint256 amount);
    event Repay(address indexed user, address indexed token, uint256 amount);
    event Liquidation(
        address indexed liquidator,
        address indexed borrower,
        address indexed collateralToken,
        address borrowToken,
        uint256 liquidatedAmount,
        uint256 seizedAmount
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Market management functions
    function listMarket(
        address token,
        address priceOracle,
        uint256 reserveFactor,
        uint256 collateralFactor,
        uint256 baseRate,
        uint256 multiplier,
        uint256 jumpMultiplier,
        uint256 kink
    ) external onlyRole(ADMIN_ROLE) {
        require(!isMarketListed[token], "Market already listed");
        require(collateralFactor <= PRECISION, "Invalid collateral factor");

        markets[token] = Market({
            token: IERC20(token),
            priceOracle: AggregatorV3Interface(priceOracle),
            totalSupply: 0,
            totalBorrows: 0,
            reserveFactor: reserveFactor,
            collateralFactor: collateralFactor,
            baseInterestRate: baseRate,
            multiplier: multiplier,
            jumpMultiplier: jumpMultiplier,
            kink: kink,
            lastUpdateTimestamp: block.timestamp,
            borrowIndex: PRECISION,
            supplyIndex: PRECISION,
            isListed: true,
            canBorrow: true,
            canCollateralize: true
        });

        isMarketListed[token] = true;
        allMarkets.push(token);

        emit MarketListed(token, priceOracle);
    }

    // Supply functions
    function supply(address token, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        require(isMarketListed[token], "Market not listed");
        require(amount > 0, "Amount must be positive");

        Market storage market = markets[token];
        UserAccount storage account = userAccounts[msg.sender];

        // Update interest rates and indices
        updateMarketInterest(token);

        // Calculate cTokens to mint
        uint256 exchangeRate = getExchangeRate(token);
        uint256 mintTokens = (amount * PRECISION) / exchangeRate;

        // Transfer tokens from user
        market.token.safeTransferFrom(msg.sender, address(this), amount);

        // Update balances
        account.balances[token] += mintTokens;
        market.totalSupply += mintTokens;

        // Add market to user's assets if first time
        if (!isInMarket(msg.sender, token)) {
            account.assetsIn.push(token);
        }

        emit Supply(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        require(isMarketListed[token], "Market not listed");

        Market storage market = markets[token];
        UserAccount storage account = userAccounts[msg.sender];

        updateMarketInterest(token);

        uint256 exchangeRate = getExchangeRate(token);
        uint256 redeemTokens = (amount * PRECISION) / exchangeRate;

        require(account.balances[token] >= redeemTokens, "Insufficient balance");

        // Check if withdrawal would leave account undercollateralized
        require(
            checkWithdrawAllowed(msg.sender, token, redeemTokens),
            "Insufficient collateral"
        );

        // Update balances
        account.balances[token] -= redeemTokens;
        market.totalSupply -= redeemTokens;

        // Transfer tokens to user
        market.token.safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, token, amount);
    }

    // Borrow functions
    function borrow(address token, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        require(isMarketListed[token], "Market not listed");
        require(markets[token].canBorrow, "Borrowing paused");
        require(amount > 0, "Amount must be positive");

        Market storage market = markets[token];
        UserAccount storage account = userAccounts[msg.sender];

        updateMarketInterest(token);

        // Check borrowing capacity
        (uint256 liquidity, uint256 shortfall) = getAccountLiquidity(msg.sender);
        require(shortfall == 0, "Insufficient collateral");

        uint256 borrowValueUSD = (amount * getAssetPrice(token)) / PRECISION;
        require(borrowValueUSD <= liquidity, "Insufficient liquidity");

        // Calculate new borrow balance with interest
        uint256 borrowBalance = getBorrowBalance(msg.sender, token);
        uint256 newBorrowBalance = borrowBalance + amount;

        // Update user borrow state
        account.borrowBalances[token] = newBorrowBalance;
        account.borrowIndex[token] = market.borrowIndex;
        market.totalBorrows += amount;

        // Add market to user's assets if first time
        if (!isInMarket(msg.sender, token)) {
            account.assetsIn.push(token);
        }

        // Transfer borrowed tokens to user
        market.token.safeTransfer(msg.sender, amount);

        emit Borrow(msg.sender, token, amount);
    }

    function repay(address token, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        require(isMarketListed[token], "Market not listed");

        Market storage market = markets[token];
        UserAccount storage account = userAccounts[msg.sender];

        updateMarketInterest(token);

        uint256 borrowBalance = getBorrowBalance(msg.sender, token);
        require(borrowBalance > 0, "No debt to repay");

        // Calculate actual repay amount (handle overpayment)
        uint256 repayAmount = Math.min(amount, borrowBalance);

        // Transfer repay amount from user
        market.token.safeTransferFrom(msg.sender, address(this), repayAmount);

        // Update borrow state
        uint256 newBorrowBalance = borrowBalance - repayAmount;
        account.borrowBalances[token] = newBorrowBalance;
        account.borrowIndex[token] = market.borrowIndex;
        market.totalBorrows -= repayAmount;

        emit Repay(msg.sender, token, repayAmount);
    }

    // Liquidation functions
    function liquidateBorrow(
        address borrower,
        address borrowToken,
        address collateralToken,
        uint256 repayAmount
    ) external nonReentrant whenNotPaused onlyRole(LIQUIDATOR_ROLE) {
        require(isMarketListed[borrowToken], "Borrow market not listed");
        require(isMarketListed[collateralToken], "Collateral market not listed");

        // Update both markets
        updateMarketInterest(borrowToken);
        updateMarketInterest(collateralToken);

        // Check if borrower is liquidatable
        (uint256 liquidity, uint256 shortfall) = getAccountLiquidity(borrower);
        require(shortfall > 0, "Account not liquidatable");

        uint256 borrowBalance = getBorrowBalance(borrower, borrowToken);
        require(borrowBalance > 0, "No debt to liquidate");

        // Calculate maximum liquidation amount
        uint256 maxRepayAmount = (borrowBalance * closeFactorMantissa) / PRECISION;
        require(repayAmount <= maxRepayAmount, "Repay amount too high");

        // Calculate seize amount
        uint256 seizeAmount = calculateSeizeAmount(
            borrowToken,
            collateralToken,
            repayAmount
        );

        // Perform liquidation
        performLiquidation(
            msg.sender,
            borrower,
            borrowToken,
            collateralToken,
            repayAmount,
            seizeAmount
        );

        emit Liquidation(
            msg.sender,
            borrower,
            collateralToken,
            borrowToken,
            repayAmount,
            seizeAmount
        );
    }

    // Interest rate calculations
    function updateMarketInterest(address token) public {
        Market storage market = markets[token];

        if (market.lastUpdateTimestamp == block.timestamp) {
            return; // Already updated this block
        }

        uint256 timeElapsed = block.timestamp - market.lastUpdateTimestamp;
        uint256 utilizationRate = getUtilizationRate(token);
        uint256 borrowRate = getBorrowRate(token, utilizationRate);
        uint256 supplyRate = getSupplyRate(token, borrowRate, utilizationRate);

        // Update borrow index
        uint256 borrowIndexNew = (borrowRate * timeElapsed * market.borrowIndex) /
                                PRECISION + market.borrowIndex;

        // Update supply index
        uint256 supplyIndexNew = (supplyRate * timeElapsed * market.supplyIndex) /
                                PRECISION + market.supplyIndex;

        market.borrowIndex = borrowIndexNew;
        market.supplyIndex = supplyIndexNew;
        market.lastUpdateTimestamp = block.timestamp;
    }

    function getBorrowRate(address token, uint256 utilizationRate)
        public
        view
        returns (uint256)
    {
        Market storage market = markets[token];

        if (utilizationRate <= market.kink) {
            // Below kink: rate = base + utilization * multiplier
            return market.baseInterestRate +
                   (utilizationRate * market.multiplier) / PRECISION;
        } else {
            // Above kink: rate = base + kink * multiplier + excess * jumpMultiplier
            uint256 baseRate = market.baseInterestRate +
                              (market.kink * market.multiplier) / PRECISION;
            uint256 excessUtilization = utilizationRate - market.kink;
            return baseRate + (excessUtilization * market.jumpMultiplier) / PRECISION;
        }
    }

    function getSupplyRate(
        address token,
        uint256 borrowRate,
        uint256 utilizationRate
    ) public view returns (uint256) {
        Market storage market = markets[token];

        uint256 rateToPool = (borrowRate * (PRECISION - market.reserveFactor)) / PRECISION;
        return (utilizationRate * rateToPool) / PRECISION;
    }

    function getUtilizationRate(address token) public view returns (uint256) {
        Market storage market = markets[token];

        if (market.totalSupply == 0) {
            return 0;
        }

        return (market.totalBorrows * PRECISION) / getTotalCash(token);
    }

    // Price and valuation functions
    function getAssetPrice(address token) public view returns (uint256) {
        Market storage market = markets[token];

        (, int256 price, , uint256 updatedAt, ) = market.priceOracle.latestRoundData();

        require(price > 0, "Invalid price");
        require(block.timestamp - updatedAt <= 3600, "Price too stale"); // 1 hour

        return uint256(price) * 1e10; // Convert to 18 decimals
    }

    function getAccountLiquidity(address user)
        public
        view
        returns (uint256 liquidity, uint256 shortfall)
    {
        UserAccount storage account = userAccounts[user];

        uint256 totalCollateralValueUSD = 0;
        uint256 totalBorrowValueUSD = 0;

        // Calculate total collateral and borrow values
        for (uint256 i = 0; i < account.assetsIn.length; i++) {
            address asset = account.assetsIn[i];
            Market storage market = markets[asset];

            // Collateral value
            uint256 balance = account.balances[asset];
            if (balance > 0 && market.canCollateralize) {
                uint256 exchangeRate = getExchangeRate(asset);
                uint256 underlyingBalance = (balance * exchangeRate) / PRECISION;
                uint256 valueUSD = (underlyingBalance * getAssetPrice(asset)) / PRECISION;
                uint256 collateralValue = (valueUSD * market.collateralFactor) / PRECISION;
                totalCollateralValueUSD += collateralValue;
            }

            // Borrow value
            uint256 borrowBalance = getBorrowBalance(user, asset);
            if (borrowBalance > 0) {
                uint256 valueUSD = (borrowBalance * getAssetPrice(asset)) / PRECISION;
                totalBorrowValueUSD += valueUSD;
            }
        }

        // Calculate liquidity or shortfall
        if (totalCollateralValueUSD >= totalBorrowValueUSD) {
            liquidity = totalCollateralValueUSD - totalBorrowValueUSD;
            shortfall = 0;
        } else {
            liquidity = 0;
            shortfall = totalBorrowValueUSD - totalCollateralValueUSD;
        }
    }

    // Helper functions
    function getBorrowBalance(address user, address token)
        public
        view
        returns (uint256)
    {
        UserAccount storage account = userAccounts[user];
        Market storage market = markets[token];

        uint256 storedBalance = account.borrowBalances[token];
        if (storedBalance == 0) {
            return 0;
        }

        uint256 storedIndex = account.borrowIndex[token];
        return (storedBalance * market.borrowIndex) / storedIndex;
    }

    function getExchangeRate(address token) public view returns (uint256) {
        Market storage market = markets[token];

        if (market.totalSupply == 0) {
            return PRECISION;
        }

        return (getTotalCash(token) * PRECISION) / market.totalSupply;
    }

    function getTotalCash(address token) public view returns (uint256) {
        Market storage market = markets[token];
        return market.token.balanceOf(address(this));
    }

    function isInMarket(address user, address token) internal view returns (bool) {
        UserAccount storage account = userAccounts[user];

        for (uint256 i = 0; i < account.assetsIn.length; i++) {
            if (account.assetsIn[i] == token) {
                return true;
            }
        }
        return false;
    }

    function checkWithdrawAllowed(
        address user,
        address token,
        uint256 redeemTokens
    ) internal view returns (bool) {
        // Simulate withdrawal and check if account remains healthy
        Market storage market = markets[token];
        uint256 exchangeRate = getExchangeRate(token);
        uint256 redeemAmount = (redeemTokens * exchangeRate) / PRECISION;
        uint256 valueUSD = (redeemAmount * getAssetPrice(token) * market.collateralFactor) /
                          (PRECISION * PRECISION);

        (uint256 liquidity, ) = getAccountLiquidity(user);
        return liquidity >= valueUSD;
    }

    function calculateSeizeAmount(
        address borrowToken,
        address collateralToken,
        uint256 repayAmount
    ) internal view returns (uint256) {
        uint256 borrowPrice = getAssetPrice(borrowToken);
        uint256 collateralPrice = getAssetPrice(collateralToken);

        uint256 exchangeRate = getExchangeRate(collateralToken);
        uint256 seizeFactor = PRECISION + LIQUIDATION_BONUS;

        uint256 seizeAmountUSD = (repayAmount * borrowPrice * seizeFactor) /
                                (collateralPrice * PRECISION);

        return (seizeAmountUSD * PRECISION) / exchangeRate;
    }

    function performLiquidation(
        address liquidator,
        address borrower,
        address borrowToken,
        address collateralToken,
        uint256 repayAmount,
        uint256 seizeAmount
    ) internal {
        Market storage borrowMarket = markets[borrowToken];
        Market storage collateralMarket = markets[collateralToken];

        UserAccount storage borrowerAccount = userAccounts[borrower];
        UserAccount storage liquidatorAccount = userAccounts[liquidator];

        // Transfer repay amount from liquidator
        borrowMarket.token.safeTransferFrom(liquidator, address(this), repayAmount);

        // Update borrower's debt
        uint256 borrowBalance = getBorrowBalance(borrower, borrowToken);
        borrowerAccount.borrowBalances[borrowToken] = borrowBalance - repayAmount;
        borrowerAccount.borrowIndex[borrowToken] = borrowMarket.borrowIndex;
        borrowMarket.totalBorrows -= repayAmount;

        // Transfer collateral from borrower to liquidator
        borrowerAccount.balances[collateralToken] -= seizeAmount;
        liquidatorAccount.balances[collateralToken] += seizeAmount;

        // Protocol takes a small percentage
        uint256 protocolSeizeAmount = (seizeAmount * protocolSeizeShareMantissa) / PRECISION;
        if (protocolSeizeAmount > 0) {
            liquidatorAccount.balances[collateralToken] -= protocolSeizeAmount;
            // Protocol reserves would be handled here
        }
    }

    // Admin functions
    function setReserveFactor(address token, uint256 newReserveFactor)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(isMarketListed[token], "Market not listed");
        require(newReserveFactor <= PRECISION, "Invalid reserve factor");

        updateMarketInterest(token);
        markets[token].reserveFactor = newReserveFactor;
    }

    function setCollateralFactor(address token, uint256 newCollateralFactor)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(isMarketListed[token], "Market not listed");
        require(newCollateralFactor <= PRECISION, "Invalid collateral factor");

        markets[token].collateralFactor = newCollateralFactor;
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // View functions for UI
    function getMarketInfo(address token)
        external
        view
        returns (
            uint256 totalSupply,
            uint256 totalBorrows,
            uint256 supplyRate,
            uint256 borrowRate,
            uint256 utilizationRate,
            uint256 exchangeRate,
            uint256 price
        )
    {
        Market storage market = markets[token];

        utilizationRate = getUtilizationRate(token);
        borrowRate = getBorrowRate(token, utilizationRate);
        supplyRate = getSupplyRate(token, borrowRate, utilizationRate);
        exchangeRate = getExchangeRate(token);
        price = getAssetPrice(token);

        return (
            market.totalSupply,
            market.totalBorrows,
            supplyRate,
            borrowRate,
            utilizationRate,
            exchangeRate,
            price
        );
    }

    function getUserAccountInfo(address user)
        external
        view
        returns (
            address[] memory assetsIn,
            uint256[] memory supplyBalances,
            uint256[] memory borrowBalances,
            uint256 totalCollateralValueUSD,
            uint256 totalBorrowValueUSD,
            uint256 healthFactor
        )
    {
        UserAccount storage account = userAccounts[user];
        assetsIn = account.assetsIn;

        supplyBalances = new uint256[](assetsIn.length);
        borrowBalances = new uint256[](assetsIn.length);

        uint256 totalCollateral = 0;
        uint256 totalBorrow = 0;

        for (uint256 i = 0; i < assetsIn.length; i++) {
            address asset = assetsIn[i];

            // Supply balance in underlying tokens
            uint256 cTokenBalance = account.balances[asset];
            uint256 exchangeRate = getExchangeRate(asset);
            supplyBalances[i] = (cTokenBalance * exchangeRate) / PRECISION;

            // Borrow balance
            borrowBalances[i] = getBorrowBalance(user, asset);

            // USD values
            uint256 price = getAssetPrice(asset);
            totalCollateral += (supplyBalances[i] * price * markets[asset].collateralFactor) /
                              (PRECISION * PRECISION);
            totalBorrow += (borrowBalances[i] * price) / PRECISION;
        }

        totalCollateralValueUSD = totalCollateral;
        totalBorrowValueUSD = totalBorrow;

        // Health factor calculation
        if (totalBorrow > 0) {
            healthFactor = (totalCollateral * PRECISION) / totalBorrow;
        } else {
            healthFactor = type(uint256).max; // No debt = infinite health
        }
    }
}
```

### NFT Marketplace Implementation
```typescript
// Advanced NFT marketplace with modern Web3 integration
import { ethers } from 'ethers';
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractWrite, useContractRead } from 'wagmi';
import { uploadToIPFS, pinataClient } from '@/lib/ipfs';
import { toast } from 'react-hot-toast';

// Smart contract ABI
const MARKETPLACE_ABI = [
  // Contract interface here
] as const;

// Types
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  background_color?: string;
  animation_url?: string;
  youtube_url?: string;
}

interface NFTListing {
  tokenId: string;
  seller: string;
  price: string;
  isActive: boolean;
  timestamp: number;
  metadata?: NFTMetadata;
}

interface MarketplaceStats {
  totalVolume: string;
  totalSales: number;
  averagePrice: string;
  uniqueOwners: number;
}

// Custom hooks
export const useNFTMarketplace = () => {
  const { address } = useAccount();
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);

  // Contract interactions
  const { write: createListing } = useContractWrite({
    address: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`,
    abi: MARKETPLACE_ABI,
    functionName: 'createListing',
    onSuccess: (data) => {
      toast.success('NFT listed successfully!');
      console.log('Transaction hash:', data.hash);
    },
    onError: (error) => {
      toast.error('Failed to list NFT');
      console.error('Error:', error);
    },
  });

  const { write: buyNFT } = useContractWrite({
    address: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`,
    abi: MARKETPLACE_ABI,
    functionName: 'buyNFT',
    onSuccess: (data) => {
      toast.success('NFT purchased successfully!');
      console.log('Transaction hash:', data.hash);
    },
    onError: (error) => {
      toast.error('Failed to purchase NFT');
      console.error('Error:', error);
    },
  });

  // Fetch marketplace data
  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS!,
        MARKETPLACE_ABI,
        provider
      );

      // Get active listings
      const activeListings = await contract.getActiveListings();

      // Fetch metadata for each listing
      const listingsWithMetadata = await Promise.all(
        activeListings.map(async (listing: any) => {
          try {
            const tokenURI = await contract.tokenURI(listing.tokenId);
            const response = await fetch(tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/'));
            const metadata: NFTMetadata = await response.json();

            return {
              tokenId: listing.tokenId.toString(),
              seller: listing.seller,
              price: ethers.utils.formatEther(listing.price),
              isActive: listing.isActive,
              timestamp: listing.timestamp.toNumber(),
              metadata,
            };
          } catch (error) {
            console.error(`Failed to fetch metadata for token ${listing.tokenId}:`, error);
            return {
              tokenId: listing.tokenId.toString(),
              seller: listing.seller,
              price: ethers.utils.formatEther(listing.price),
              isActive: listing.isActive,
              timestamp: listing.timestamp.toNumber(),
            };
          }
        })
      );

      setListings(listingsWithMetadata);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to fetch marketplace data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMarketplaceStats = useCallback(async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS!,
        MARKETPLACE_ABI,
        provider
      );

      const [totalVolume, totalSales, uniqueOwners] = await Promise.all([
        contract.getTotalVolume(),
        contract.getTotalSales(),
        contract.getUniqueOwners(),
      ]);

      const averagePrice = totalSales > 0
        ? ethers.utils.formatEther(totalVolume.div(totalSales))
        : '0';

      setStats({
        totalVolume: ethers.utils.formatEther(totalVolume),
        totalSales: totalSales.toNumber(),
        averagePrice,
        uniqueOwners: uniqueOwners.toNumber(),
      });
    } catch (error) {
      console.error('Error fetching marketplace stats:', error);
    }
  }, []);

  // NFT minting with metadata upload
  const mintNFT = useCallback(async (
    metadata: NFTMetadata,
    file: File,
    royaltyPercentage: number = 5
  ) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      // Upload image to IPFS
      const imageFormData = new FormData();
      imageFormData.append('file', file);

      const imageResult = await pinataClient.pinFileToIPFS(imageFormData, {
        pinataMetadata: {
          name: `${metadata.name}-image`,
        },
      });

      const imageURI = `ipfs://${imageResult.IpfsHash}`;

      // Update metadata with IPFS image URI
      const completeMetadata: NFTMetadata = {
        ...metadata,
        image: imageURI,
      };

      // Upload metadata to IPFS
      const metadataResult = await pinataClient.pinJSONToIPFS(completeMetadata, {
        pinataMetadata: {
          name: `${metadata.name}-metadata`,
        },
      });

      const metadataURI = `ipfs://${metadataResult.IpfsHash}`;

      // Mint NFT with metadata URI
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFT_ADDRESS!,
        MARKETPLACE_ABI,
        signer
      );

      const royaltyBasisPoints = royaltyPercentage * 100; // Convert to basis points
      const tx = await contract.mintNFT(address, metadataURI, royaltyBasisPoints);

      toast.success('Minting in progress...');
      const receipt = await tx.wait();

      // Get token ID from logs
      const tokenId = receipt.events?.find((e: any) => e.event === 'Transfer')?.args?.tokenId;

      toast.success(`NFT minted successfully! Token ID: ${tokenId}`);
      return { tokenId: tokenId?.toString(), transactionHash: receipt.transactionHash };

    } catch (error) {
      console.error('Error minting NFT:', error);
      toast.error('Failed to mint NFT');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [address]);

  // List NFT for sale
  const listNFTForSale = useCallback(async (
    tokenId: string,
    priceInEth: string
  ) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const priceInWei = ethers.utils.parseEther(priceInEth);

      createListing({
        args: [tokenId, priceInWei],
      });
    } catch (error) {
      console.error('Error listing NFT:', error);
      toast.error('Failed to list NFT');
    }
  }, [address, createListing]);

  // Purchase NFT
  const purchaseNFT = useCallback(async (
    tokenId: string,
    priceInEth: string
  ) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const priceInWei = ethers.utils.parseEther(priceInEth);

      buyNFT({
        args: [tokenId],
        value: priceInWei,
      });
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      toast.error('Failed to purchase NFT');
    }
  }, [address, buyNFT]);

  // Get user's NFTs
  const getUserNFTs = useCallback(async (userAddress?: string) => {
    const targetAddress = userAddress || address;
    if (!targetAddress) return [];

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFT_ADDRESS!,
        MARKETPLACE_ABI,
        provider
      );

      const balance = await contract.balanceOf(targetAddress);
      const tokenIds = [];

      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(targetAddress, i);
        tokenIds.push(tokenId.toString());
      }

      // Fetch metadata for user's NFTs
      const nftsWithMetadata = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            const tokenURI = await contract.tokenURI(tokenId);
            const response = await fetch(tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/'));
            const metadata: NFTMetadata = await response.json();

            return {
              tokenId,
              metadata,
              owner: targetAddress,
            };
          } catch (error) {
            console.error(`Failed to fetch metadata for token ${tokenId}:`, error);
            return {
              tokenId,
              owner: targetAddress,
            };
          }
        })
      );

      return nftsWithMetadata;
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      return [];
    }
  }, [address]);

  // Check NFT royalties
  const getNFTRoyalties = useCallback(async (tokenId: string) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFT_ADDRESS!,
        MARKETPLACE_ABI,
        provider
      );

      const salePrice = ethers.utils.parseEther('1'); // 1 ETH for calculation
      const [recipient, royaltyAmount] = await contract.royaltyInfo(tokenId, salePrice);

      const royaltyPercentage = (royaltyAmount.toNumber() / salePrice.toNumber()) * 100;

      return {
        recipient,
        percentage: royaltyPercentage,
      };
    } catch (error) {
      console.error('Error fetching royalty info:', error);
      return null;
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchListings();
    fetchMarketplaceStats();
  }, [fetchListings, fetchMarketplaceStats]);

  return {
    // State
    listings,
    loading,
    stats,

    // Functions
    mintNFT,
    listNFTForSale,
    purchaseNFT,
    getUserNFTs,
    getNFTRoyalties,
    fetchListings,
    fetchMarketplaceStats,
  };
};

// React component for NFT marketplace
export const NFTMarketplace: React.FC = () => {
  const {
    listings,
    loading,
    stats,
    purchaseNFT,
    fetchListings,
  } = useNFTMarketplace();

  const [sortBy, setSortBy] = useState<'price' | 'timestamp'>('timestamp');
  const [filterBy, setFilterBy] = useState<'all' | 'under_1_eth' | 'over_1_eth'>('all');

  const filteredAndSortedListings = listings
    .filter(listing => {
      if (filterBy === 'under_1_eth') return parseFloat(listing.price) < 1;
      if (filterBy === 'over_1_eth') return parseFloat(listing.price) >= 1;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price') {
        return parseFloat(a.price) - parseFloat(b.price);
      }
      return b.timestamp - a.timestamp;
    });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Marketplace Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Volume</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {parseFloat(stats.totalVolume).toFixed(2)} ETH
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalSales.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Price</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {parseFloat(stats.averagePrice).toFixed(4)} ETH
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Owners</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.uniqueOwners.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All NFTs</option>
            <option value="under_1_eth">Under 1 ETH</option>
            <option value="over_1_eth">1 ETH and Above</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="timestamp">Latest First</option>
            <option value="price">Price: Low to High</option>
          </select>
        </div>

        <button
          onClick={fetchListings}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedListings.map((listing) => (
          <div
            key={listing.tokenId}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="aspect-square relative">
              {listing.metadata?.image ? (
                <img
                  src={listing.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                  alt={listing.metadata.name || `NFT ${listing.tokenId}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-nft.png';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">No Image</span>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {listing.metadata?.name || `NFT #${listing.tokenId}`}
              </h3>

              {listing.metadata?.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                  {listing.metadata.description}
                </p>
              )}

              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {parseFloat(listing.price).toFixed(4)} ETH
                </span>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">Seller</span>
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                </span>
              </div>

              <button
                onClick={() => purchaseNFT(listing.tokenId, listing.price)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedListings.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No NFTs found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default NFTMarketplace;
```

## Skill Activation Triggers

This skill automatically activates when:
- Blockchain development is requested
- Smart contract creation is needed
- DeFi protocol development is required
- NFT marketplace implementation is requested
- Web3 application development is needed
- Cryptocurrency project development is required

This comprehensive blockchain development skill provides expert-level capabilities for building modern decentralized applications using cutting-edge tools and security best practices.