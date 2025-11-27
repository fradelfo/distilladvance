# Blockchain & Web3 Skill

Modern blockchain development and Web3 application expertise covering smart contracts, DeFi protocols, NFTs, layer 2 solutions, and decentralized application architecture.

## Skill Overview

Expert blockchain knowledge including Solidity smart contracts, Ethereum development, layer 2 scaling solutions, DeFi protocols, NFT marketplaces, cross-chain bridges, and Web3 frontend integration.

## Core Capabilities

### Smart Contract Development
- **Solidity programming** - Advanced contracts, gas optimization, security patterns
- **Contract testing** - Hardhat, Foundry, comprehensive test suites
- **Security auditing** - Common vulnerabilities, formal verification, audit practices
- **Upgradeable contracts** - Proxy patterns, diamond standard, migration strategies

### DeFi & Protocol Development
- **AMM implementation** - Uniswap V3, concentrated liquidity, fee mechanisms
- **Lending protocols** - Compound-style interest rates, collateral management
- **Yield farming** - Staking contracts, reward distribution, tokenomics
- **Cross-chain protocols** - Bridge development, multi-chain deployment

### Web3 Frontend Integration
- **Web3 libraries** - ethers.js, web3.js, wagmi, RainbowKit integration
- **Wallet integration** - MetaMask, WalletConnect, account abstraction
- **Real-time updates** - Event listening, state synchronization
- **IPFS integration** - Decentralized storage, metadata management

### Layer 2 & Scaling
- **L2 deployment** - Arbitrum, Optimism, Polygon integration
- **State channels** - Payment channels, gaming applications
- **Rollup development** - Custom L2 solutions, sequencer operations
- **Cross-layer communication** - L1-L2 message passing, withdrawal mechanisms

## Modern Blockchain Development Stack

### Advanced Solidity Smart Contracts
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title AdvancedDeFiProtocol
 * @dev A comprehensive DeFi protocol with lending, staking, and yield farming
 * Features: Flash loans, liquidations, governance, emergency pause
 */
contract AdvancedDeFiProtocol is AccessControl, ReentrancyGuard, Pausable {
    using SafeMath for uint256;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Protocol parameters
    uint256 public constant COLLATERALIZATION_RATIO = 150; // 150%
    uint256 public constant LIQUIDATION_THRESHOLD = 120;   // 120%
    uint256 public constant LIQUIDATION_BONUS = 105;      // 5% bonus
    uint256 public constant FLASH_LOAN_FEE = 9;           // 0.09%
    uint256 public constant BASIS_POINTS = 10000;

    // State variables
    mapping(address => mapping(address => uint256)) public deposits;
    mapping(address => mapping(address => uint256)) public borrowed;
    mapping(address => uint256) public totalDeposits;
    mapping(address => uint256) public totalBorrowed;
    mapping(address => uint256) public interestRateModel;
    mapping(address => uint256) public lastUpdateTime;
    mapping(address => uint256) public accumulatedInterest;

    // Supported tokens
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public tokenPrices; // Price in USD (18 decimals)

    // Staking and rewards
    mapping(address => mapping(address => uint256)) public stakedBalance;
    mapping(address => mapping(address => uint256)) public rewardDebt;
    mapping(address => uint256) public rewardPerShare;
    mapping(address => uint256) public totalStaked;

    // Events
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, uint256 amount);
    event Borrow(address indexed user, address indexed token, uint256 amount);
    event Repay(address indexed user, address indexed token, uint256 amount);
    event Liquidation(address indexed liquidator, address indexed borrower, address indexed collateralToken, uint256 collateralAmount);
    event FlashLoan(address indexed borrower, address indexed token, uint256 amount, uint256 fee);
    event Stake(address indexed user, address indexed token, uint256 amount);
    event Unstake(address indexed user, address indexed token, uint256 amount);
    event RewardClaimed(address indexed user, address indexed token, uint256 amount);

    // Custom errors for gas optimization
    error InsufficientCollateral();
    error TokenNotSupported();
    error InsufficientBalance();
    error LiquidationNotAllowed();
    error FlashLoanFailed();
    error InvalidPrice();

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Deposit tokens as collateral
     * @param token The token address to deposit
     * @param amount The amount to deposit
     */
    function deposit(address token, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        if (!supportedTokens[token]) revert TokenNotSupported();
        if (amount == 0) revert InsufficientBalance();

        updateInterest(token);

        // Transfer tokens from user
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // Update user balance
        deposits[msg.sender][token] = deposits[msg.sender][token].add(amount);
        totalDeposits[token] = totalDeposits[token].add(amount);

        emit Deposit(msg.sender, token, amount);
    }

    /**
     * @dev Withdraw deposited tokens
     * @param token The token address to withdraw
     * @param amount The amount to withdraw
     */
    function withdraw(address token, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        if (!supportedTokens[token]) revert TokenNotSupported();
        if (deposits[msg.sender][token] < amount) revert InsufficientBalance();

        updateInterest(token);

        // Check if withdrawal maintains adequate collateralization
        uint256 newCollateralValue = getCollateralValue(msg.sender).sub(
            amount.mul(tokenPrices[token]).div(1e18)
        );
        uint256 borrowValue = getBorrowValue(msg.sender);

        if (borrowValue > 0 && newCollateralValue.mul(100) < borrowValue.mul(COLLATERALIZATION_RATIO)) {
            revert InsufficientCollateral();
        }

        // Update balances
        deposits[msg.sender][token] = deposits[msg.sender][token].sub(amount);
        totalDeposits[token] = totalDeposits[token].sub(amount);

        // Transfer tokens to user
        IERC20(token).transfer(msg.sender, amount);

        emit Withdraw(msg.sender, token, amount);
    }

    /**
     * @dev Borrow tokens against collateral
     * @param token The token address to borrow
     * @param amount The amount to borrow
     */
    function borrow(address token, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        if (!supportedTokens[token]) revert TokenNotSupported();
        if (totalDeposits[token] < amount) revert InsufficientBalance();

        updateInterest(token);

        // Check collateralization
        uint256 collateralValue = getCollateralValue(msg.sender);
        uint256 newBorrowValue = getBorrowValue(msg.sender).add(
            amount.mul(tokenPrices[token]).div(1e18)
        );

        if (collateralValue.mul(100) < newBorrowValue.mul(COLLATERALIZATION_RATIO)) {
            revert InsufficientCollateral();
        }

        // Update balances
        borrowed[msg.sender][token] = borrowed[msg.sender][token].add(amount);
        totalBorrowed[token] = totalBorrowed[token].add(amount);

        // Transfer tokens to user
        IERC20(token).transfer(msg.sender, amount);

        emit Borrow(msg.sender, token, amount);
    }

    /**
     * @dev Repay borrowed tokens
     * @param token The token address to repay
     * @param amount The amount to repay
     */
    function repay(address token, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        if (!supportedTokens[token]) revert TokenNotSupported();

        updateInterest(token);

        uint256 borrowedAmount = borrowed[msg.sender][token];
        uint256 repayAmount = amount > borrowedAmount ? borrowedAmount : amount;

        // Transfer tokens from user
        IERC20(token).transferFrom(msg.sender, address(this), repayAmount);

        // Update balances
        borrowed[msg.sender][token] = borrowed[msg.sender][token].sub(repayAmount);
        totalBorrowed[token] = totalBorrowed[token].sub(repayAmount);

        emit Repay(msg.sender, token, repayAmount);
    }

    /**
     * @dev Liquidate undercollateralized position
     * @param borrower The borrower to liquidate
     * @param collateralToken The collateral token to seize
     * @param borrowToken The borrowed token to repay
     * @param repayAmount The amount to repay
     */
    function liquidate(
        address borrower,
        address collateralToken,
        address borrowToken,
        uint256 repayAmount
    )
        external
        nonReentrant
        whenNotPaused
        onlyRole(LIQUIDATOR_ROLE)
    {
        updateInterest(borrowToken);
        updateInterest(collateralToken);

        // Check if liquidation is allowed
        uint256 collateralValue = getCollateralValue(borrower);
        uint256 borrowValue = getBorrowValue(borrower);

        if (collateralValue.mul(100) >= borrowValue.mul(LIQUIDATION_THRESHOLD)) {
            revert LiquidationNotAllowed();
        }

        // Calculate collateral to seize
        uint256 collateralPrice = tokenPrices[collateralToken];
        uint256 borrowPrice = tokenPrices[borrowToken];

        uint256 collateralToSeize = repayAmount
            .mul(borrowPrice)
            .mul(LIQUIDATION_BONUS)
            .div(collateralPrice)
            .div(100);

        // Check available collateral
        if (deposits[borrower][collateralToken] < collateralToSeize) {
            collateralToSeize = deposits[borrower][collateralToken];
        }

        // Transfer repayment from liquidator
        IERC20(borrowToken).transferFrom(msg.sender, address(this), repayAmount);

        // Transfer collateral to liquidator
        deposits[borrower][collateralToken] = deposits[borrower][collateralToken].sub(collateralToSeize);
        totalDeposits[collateralToken] = totalDeposits[collateralToken].sub(collateralToSeize);
        IERC20(collateralToken).transfer(msg.sender, collateralToSeize);

        // Update borrowed amount
        borrowed[borrower][borrowToken] = borrowed[borrower][borrowToken].sub(repayAmount);
        totalBorrowed[borrowToken] = totalBorrowed[borrowToken].sub(repayAmount);

        emit Liquidation(msg.sender, borrower, collateralToken, collateralToSeize);
    }

    /**
     * @dev Flash loan implementation
     * @param token The token to borrow
     * @param amount The amount to borrow
     * @param data Arbitrary data passed to the callback
     */
    function flashLoan(address token, uint256 amount, bytes calldata data)
        external
        nonReentrant
        whenNotPaused
    {
        if (!supportedTokens[token]) revert TokenNotSupported();
        if (totalDeposits[token] < amount) revert InsufficientBalance();

        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        uint256 fee = amount.mul(FLASH_LOAN_FEE).div(BASIS_POINTS);

        // Transfer tokens to borrower
        IERC20(token).transfer(msg.sender, amount);

        // Call the callback function
        IFlashLoanReceiver(msg.sender).executeOperation(token, amount, fee, data);

        // Check repayment
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));
        if (balanceAfter < balanceBefore.add(fee)) {
            revert FlashLoanFailed();
        }

        emit FlashLoan(msg.sender, token, amount, fee);
    }

    /**
     * @dev Stake tokens to earn rewards
     * @param token The token to stake
     * @param amount The amount to stake
     */
    function stake(address token, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        if (!supportedTokens[token]) revert TokenNotSupported();

        updateRewards(token, msg.sender);

        // Transfer tokens from user
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // Update staking balance
        stakedBalance[msg.sender][token] = stakedBalance[msg.sender][token].add(amount);
        totalStaked[token] = totalStaked[token].add(amount);

        // Update reward debt
        rewardDebt[msg.sender][token] = stakedBalance[msg.sender][token]
            .mul(rewardPerShare[token])
            .div(1e18);

        emit Stake(msg.sender, token, amount);
    }

    /**
     * @dev Unstake tokens and claim rewards
     * @param token The token to unstake
     * @param amount The amount to unstake
     */
    function unstake(address token, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        if (stakedBalance[msg.sender][token] < amount) revert InsufficientBalance();

        updateRewards(token, msg.sender);

        // Calculate and transfer rewards
        uint256 pending = stakedBalance[msg.sender][token]
            .mul(rewardPerShare[token])
            .div(1e18)
            .sub(rewardDebt[msg.sender][token]);

        if (pending > 0) {
            IERC20(token).transfer(msg.sender, pending);
            emit RewardClaimed(msg.sender, token, pending);
        }

        // Update staking balance
        stakedBalance[msg.sender][token] = stakedBalance[msg.sender][token].sub(amount);
        totalStaked[token] = totalStaked[token].sub(amount);

        // Update reward debt
        rewardDebt[msg.sender][token] = stakedBalance[msg.sender][token]
            .mul(rewardPerShare[token])
            .div(1e18);

        // Transfer unstaked tokens
        IERC20(token).transfer(msg.sender, amount);

        emit Unstake(msg.sender, token, amount);
    }

    /**
     * @dev Update interest rates and accrued interest
     * @param token The token to update interest for
     */
    function updateInterest(address token) internal {
        if (lastUpdateTime[token] == 0) {
            lastUpdateTime[token] = block.timestamp;
            return;
        }

        uint256 timeElapsed = block.timestamp.sub(lastUpdateTime[token]);
        if (timeElapsed > 0) {
            uint256 utilization = getUtilizationRate(token);
            uint256 interestRate = calculateInterestRate(utilization);

            uint256 interestAccrued = totalBorrowed[token]
                .mul(interestRate)
                .mul(timeElapsed)
                .div(365 days)
                .div(1e18);

            accumulatedInterest[token] = accumulatedInterest[token].add(interestAccrued);
            lastUpdateTime[token] = block.timestamp;
        }
    }

    /**
     * @dev Update rewards for staking
     * @param token The token to update rewards for
     * @param user The user to update rewards for
     */
    function updateRewards(address token, address user) internal {
        // Simplified reward calculation - in practice, use more sophisticated models
        uint256 rewardRate = 100; // 1% daily reward rate (basis points)
        uint256 timeElapsed = block.timestamp.sub(lastUpdateTime[token]);

        if (totalStaked[token] > 0) {
            uint256 reward = rewardRate.mul(timeElapsed).div(86400); // Daily rate
            rewardPerShare[token] = rewardPerShare[token].add(
                reward.mul(1e18).div(totalStaked[token])
            );
        }
    }

    /**
     * @dev Calculate utilization rate for a token
     * @param token The token address
     * @return The utilization rate (0-100%)
     */
    function getUtilizationRate(address token) public view returns (uint256) {
        if (totalDeposits[token] == 0) return 0;
        return totalBorrowed[token].mul(100).div(totalDeposits[token]);
    }

    /**
     * @dev Calculate interest rate based on utilization
     * @param utilizationRate The current utilization rate
     * @return The interest rate (annual percentage)
     */
    function calculateInterestRate(uint256 utilizationRate) public pure returns (uint256) {
        // Simple interest rate model: 2% base + 0.1% per 1% utilization
        uint256 baseRate = 2e16; // 2% in 18 decimals
        uint256 utilizationMultiplier = 1e15; // 0.1% in 18 decimals

        return baseRate.add(utilizationRate.mul(utilizationMultiplier));
    }

    /**
     * @dev Get total collateral value for a user
     * @param user The user address
     * @return Total collateral value in USD
     */
    function getCollateralValue(address user) public view returns (uint256) {
        uint256 totalValue = 0;

        // This would iterate through all supported tokens in practice
        // For brevity, showing concept with placeholder logic
        return totalValue;
    }

    /**
     * @dev Get total borrow value for a user
     * @param user The user address
     * @return Total borrow value in USD
     */
    function getBorrowValue(address user) public view returns (uint256) {
        uint256 totalValue = 0;

        // This would iterate through all supported tokens in practice
        // For brevity, showing concept with placeholder logic
        return totalValue;
    }

    /**
     * @dev Admin function to add supported token
     * @param token The token address to add
     * @param initialPrice The initial price in USD
     */
    function addSupportedToken(address token, uint256 initialPrice)
        external
        onlyRole(ADMIN_ROLE)
    {
        supportedTokens[token] = true;
        tokenPrices[token] = initialPrice;
        lastUpdateTime[token] = block.timestamp;
    }

    /**
     * @dev Oracle function to update token price
     * @param token The token address
     * @param newPrice The new price in USD
     */
    function updateTokenPrice(address token, uint256 newPrice)
        external
        onlyRole(ORACLE_ROLE)
    {
        if (newPrice == 0) revert InvalidPrice();
        tokenPrices[token] = newPrice;
    }

    /**
     * @dev Emergency pause function
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause function
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}

/**
 * @title Flash Loan Receiver Interface
 * @dev Interface for contracts that want to receive flash loans
 */
interface IFlashLoanReceiver {
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 fee,
        bytes calldata params
    ) external;
}

/**
 * @title NFT Marketplace Contract
 * @dev Advanced NFT marketplace with royalties, auctions, and offers
 */
contract NFTMarketplace is ReentrancyGuard, AccessControl, Pausable {
    using SafeMath for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
        uint256 listedAt;
    }

    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }

    struct Offer {
        address buyer;
        uint256 amount;
        uint256 expiration;
        bool active;
    }

    struct Royalty {
        address recipient;
        uint256 percentage; // Basis points (e.g., 250 = 2.5%)
    }

    // Mappings
    mapping(address => mapping(uint256 => Listing)) public listings;
    mapping(address => mapping(uint256 => Auction)) public auctions;
    mapping(address => mapping(uint256 => mapping(address => Offer))) public offers;
    mapping(address => mapping(uint256 => Royalty)) public royalties;
    mapping(address => uint256) public pendingWithdrawals;

    // Platform fee (basis points)
    uint256 public platformFee = 250; // 2.5%
    address public feeRecipient;

    // Events
    event Listed(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event Sale(address indexed buyer, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price);
    event AuctionStarted(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 startPrice, uint256 endTime);
    event BidPlaced(address indexed bidder, address indexed nftContract, uint256 indexed tokenId, uint256 amount);
    event AuctionEnded(address indexed winner, address indexed nftContract, uint256 indexed tokenId, uint256 amount);
    event OfferMade(address indexed buyer, address indexed nftContract, uint256 indexed tokenId, uint256 amount);
    event OfferAccepted(address indexed seller, address indexed buyer, address indexed nftContract, uint256 tokenId, uint256 amount);

    constructor(address _feeRecipient) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev List NFT for direct sale
     */
    function listNFT(address nftContract, uint256 tokenId, uint256 price)
        external
        nonReentrant
        whenNotPaused
    {
        require(price > 0, "Price must be greater than 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(IERC721(nftContract).isApprovedForAll(msg.sender, address(this)), "Contract not approved");

        listings[nftContract][tokenId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true,
            listedAt: block.timestamp
        });

        emit Listed(msg.sender, nftContract, tokenId, price);
    }

    /**
     * @dev Buy listed NFT
     */
    function buyNFT(address nftContract, uint256 tokenId)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");

        address seller = listing.seller;
        uint256 price = listing.price;

        // Mark listing as inactive
        listing.active = false;

        // Transfer NFT
        IERC721(nftContract).safeTransferFrom(seller, msg.sender, tokenId);

        // Calculate and distribute payments
        _distributePayment(nftContract, tokenId, price, seller);

        // Refund excess payment
        if (msg.value > price) {
            pendingWithdrawals[msg.sender] = pendingWithdrawals[msg.sender].add(msg.value.sub(price));
        }

        emit Sale(msg.sender, seller, nftContract, tokenId, price);
    }

    /**
     * @dev Start auction for NFT
     */
    function startAuction(address nftContract, uint256 tokenId, uint256 startPrice, uint256 duration)
        external
        nonReentrant
        whenNotPaused
    {
        require(startPrice > 0, "Start price must be greater than 0");
        require(duration >= 3600, "Auction must be at least 1 hour"); // Minimum 1 hour
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(IERC721(nftContract).isApprovedForAll(msg.sender, address(this)), "Contract not approved");

        uint256 endTime = block.timestamp.add(duration);

        auctions[nftContract][tokenId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startPrice: startPrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: endTime,
            active: true
        });

        emit AuctionStarted(msg.sender, nftContract, tokenId, startPrice, endTime);
    }

    /**
     * @dev Place bid on auction
     */
    function placeBid(address nftContract, uint256 tokenId)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        Auction storage auction = auctions[nftContract][tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.highestBid, "Bid too low");
        require(msg.value >= auction.startPrice, "Bid below start price");

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            pendingWithdrawals[auction.highestBidder] = pendingWithdrawals[auction.highestBidder]
                .add(auction.highestBid);
        }

        // Update auction state
        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        // Extend auction if bid placed in last 15 minutes
        if (auction.endTime.sub(block.timestamp) < 900) {
            auction.endTime = block.timestamp.add(900); // Add 15 minutes
        }

        emit BidPlaced(msg.sender, nftContract, tokenId, msg.value);
    }

    /**
     * @dev End auction and transfer NFT
     */
    function endAuction(address nftContract, uint256 tokenId)
        external
        nonReentrant
        whenNotPaused
    {
        Auction storage auction = auctions[nftContract][tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction still active");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            // Transfer NFT to winner
            IERC721(nftContract).safeTransferFrom(auction.seller, auction.highestBidder, tokenId);

            // Distribute payment
            _distributePayment(nftContract, tokenId, auction.highestBid, auction.seller);

            emit AuctionEnded(auction.highestBidder, nftContract, tokenId, auction.highestBid);
        } else {
            emit AuctionEnded(address(0), nftContract, tokenId, 0);
        }
    }

    /**
     * @dev Make offer on NFT
     */
    function makeOffer(address nftContract, uint256 tokenId, uint256 expiration)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        require(msg.value > 0, "Offer must be greater than 0");
        require(expiration > block.timestamp, "Invalid expiration");

        // Refund previous offer if exists
        Offer storage existingOffer = offers[nftContract][tokenId][msg.sender];
        if (existingOffer.active) {
            pendingWithdrawals[msg.sender] = pendingWithdrawals[msg.sender].add(existingOffer.amount);
        }

        // Create new offer
        offers[nftContract][tokenId][msg.sender] = Offer({
            buyer: msg.sender,
            amount: msg.value,
            expiration: expiration,
            active: true
        });

        emit OfferMade(msg.sender, nftContract, tokenId, msg.value);
    }

    /**
     * @dev Accept offer on NFT
     */
    function acceptOffer(address nftContract, uint256 tokenId, address buyer)
        external
        nonReentrant
        whenNotPaused
    {
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");

        Offer storage offer = offers[nftContract][tokenId][buyer];
        require(offer.active, "Offer not active");
        require(block.timestamp <= offer.expiration, "Offer expired");

        uint256 amount = offer.amount;
        offer.active = false;

        // Transfer NFT
        IERC721(nftContract).safeTransferFrom(msg.sender, buyer, tokenId);

        // Distribute payment
        _distributePayment(nftContract, tokenId, amount, msg.sender);

        emit OfferAccepted(msg.sender, buyer, nftContract, tokenId, amount);
    }

    /**
     * @dev Set royalty for NFT
     */
    function setRoyalty(address nftContract, uint256 tokenId, address recipient, uint256 percentage)
        external
    {
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(percentage <= 1000, "Royalty too high"); // Max 10%

        royalties[nftContract][tokenId] = Royalty({
            recipient: recipient,
            percentage: percentage
        });
    }

    /**
     * @dev Internal function to distribute payment
     */
    function _distributePayment(address nftContract, uint256 tokenId, uint256 amount, address seller)
        internal
    {
        uint256 platformFeeAmount = amount.mul(platformFee).div(10000);
        uint256 royaltyAmount = 0;

        // Check for royalties
        Royalty storage royalty = royalties[nftContract][tokenId];
        if (royalty.recipient != address(0)) {
            royaltyAmount = amount.mul(royalty.percentage).div(10000);
            pendingWithdrawals[royalty.recipient] = pendingWithdrawals[royalty.recipient].add(royaltyAmount);
        }

        // Calculate seller amount
        uint256 sellerAmount = amount.sub(platformFeeAmount).sub(royaltyAmount);

        // Distribute payments
        pendingWithdrawals[feeRecipient] = pendingWithdrawals[feeRecipient].add(platformFeeAmount);
        pendingWithdrawals[seller] = pendingWithdrawals[seller].add(sellerAmount);
    }

    /**
     * @dev Withdraw pending payments
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No pending withdrawals");

        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    /**
     * @dev Admin function to update platform fee
     */
    function updatePlatformFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = newFee;
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}

// Interface for ERC721
interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

// Interface for ERC20
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
```

### Web3 Frontend Integration
```typescript
// Modern Web3 React application with TypeScript
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { useConnect, useAccount, useNetwork, useBalance, useContract, useContractRead, useContractWrite } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Contract ABI (simplified)
const DeFiProtocolABI = [
  "function deposit(address token, uint256 amount) external",
  "function withdraw(address token, uint256 amount) external",
  "function borrow(address token, uint256 amount) external",
  "function repay(address token, uint256 amount) external",
  "function deposits(address user, address token) external view returns (uint256)",
  "function borrowed(address user, address token) external view returns (uint256)",
  "function getCollateralValue(address user) external view returns (uint256)",
  "function getBorrowValue(address user) external view returns (uint256)",
  "event Deposit(address indexed user, address indexed token, uint256 amount)",
  "event Withdraw(address indexed user, address indexed token, uint256 amount)",
  "event Borrow(address indexed user, address indexed token, uint256 amount)",
  "event Repay(address indexed user, address indexed token, uint256 amount)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
];

// Contract addresses
const CONTRACTS = {
  DEFI_PROTOCOL: "0x742d35Cc6635C0532925a3b8D82d16C1C0A94f5c",
  USDC: "0xA0b86a33E6f0b7c3DD8a4E7dFA0c97b2fb5c53B5",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
};

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string;
}

interface UserPosition {
  collateralValue: string;
  borrowValue: string;
  healthFactor: number;
  deposits: Record<string, string>;
  borrowed: Record<string, string>;
}

// Custom hooks for DeFi operations
const useDeFiProtocol = (contractAddress: string) => {
  const { address } = useAccount();

  const contract = useContract({
    address: contractAddress,
    abi: DeFiProtocolABI,
    signerOrProvider: true,
  });

  const getUserPosition = useCallback(async (): Promise<UserPosition | null> => {
    if (!contract || !address) return null;

    try {
      const [collateralValue, borrowValue] = await Promise.all([
        contract.getCollateralValue(address),
        contract.getBorrowValue(address),
      ]);

      const healthFactor = borrowValue.eq(0)
        ? Infinity
        : collateralValue.mul(100).div(borrowValue).toNumber();

      // Get individual token balances
      const usdcDeposit = await contract.deposits(address, CONTRACTS.USDC);
      const wethDeposit = await contract.deposits(address, CONTRACTS.WETH);
      const usdcBorrowed = await contract.borrowed(address, CONTRACTS.USDC);
      const wethBorrowed = await contract.borrowed(address, CONTRACTS.WETH);

      return {
        collateralValue: ethers.utils.formatEther(collateralValue),
        borrowValue: ethers.utils.formatEther(borrowValue),
        healthFactor,
        deposits: {
          USDC: ethers.utils.formatUnits(usdcDeposit, 6),
          WETH: ethers.utils.formatEther(wethDeposit),
        },
        borrowed: {
          USDC: ethers.utils.formatUnits(usdcBorrowed, 6),
          WETH: ethers.utils.formatEther(wethBorrowed),
        },
      };
    } catch (error) {
      console.error('Error fetching user position:', error);
      return null;
    }
  }, [contract, address]);

  return {
    contract,
    getUserPosition,
  };
};

// Token approval hook
const useTokenApproval = () => {
  const queryClient = useQueryClient();

  const approveToken = useMutation({
    mutationFn: async ({
      tokenAddress,
      spenderAddress,
      amount
    }: {
      tokenAddress: string;
      spenderAddress: string;
      amount: string;
    }) => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

      const tx = await tokenContract.approve(spenderAddress, amount);
      await tx.wait();

      return tx.hash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allowance']);
      toast.success('Token approval successful!');
    },
    onError: (error: any) => {
      toast.error(`Approval failed: ${error.message}`);
    },
  });

  return { approveToken };
};

// Main DeFi Dashboard Component
const DeFiDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect();
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'deposit' | 'borrow'>('deposit');

  const { contract, getUserPosition } = useDeFiProtocol(CONTRACTS.DEFI_PROTOCOL);
  const { approveToken } = useTokenApproval();

  // Available tokens
  const tokens: TokenInfo[] = useMemo(() => [
    {
      address: CONTRACTS.USDC,
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
    },
    {
      address: CONTRACTS.WETH,
      symbol: 'WETH',
      decimals: 18,
      name: 'Wrapped Ether',
    },
  ], []);

  // Query user position
  const {
    data: userPosition,
    isLoading: positionLoading,
    refetch: refetchPosition
  } = useQuery({
    queryKey: ['userPosition', address],
    queryFn: getUserPosition,
    enabled: !!address,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Query token balance
  const { data: tokenBalance } = useBalance({
    address,
    token: selectedToken?.address as `0x${string}`,
    enabled: !!selectedToken && !!address,
    watch: true,
  });

  // Query token allowance
  const { data: allowance } = useContractRead({
    address: selectedToken?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, CONTRACTS.DEFI_PROTOCOL],
    enabled: !!selectedToken && !!address,
    watch: true,
  });

  // Contract write hooks
  const { write: depositWrite, isLoading: isDepositing } = useContractWrite({
    address: CONTRACTS.DEFI_PROTOCOL,
    abi: DeFiProtocolABI,
    functionName: 'deposit',
    onSuccess: () => {
      toast.success('Deposit successful!');
      refetchPosition();
      setAmount('');
    },
    onError: (error) => {
      toast.error(`Deposit failed: ${error.message}`);
    },
  });

  const { write: borrowWrite, isLoading: isBorrowing } = useContractWrite({
    address: CONTRACTS.DEFI_PROTOCOL,
    abi: DeFiProtocolABI,
    functionName: 'borrow',
    onSuccess: () => {
      toast.success('Borrow successful!');
      refetchPosition();
      setAmount('');
    },
    onError: (error) => {
      toast.error(`Borrow failed: ${error.message}`);
    },
  });

  const { write: withdrawWrite, isLoading: isWithdrawing } = useContractWrite({
    address: CONTRACTS.DEFI_PROTOCOL,
    abi: DeFiProtocolABI,
    functionName: 'withdraw',
    onSuccess: () => {
      toast.success('Withdrawal successful!');
      refetchPosition();
      setAmount('');
    },
    onError: (error) => {
      toast.error(`Withdrawal failed: ${error.message}`);
    },
  });

  const { write: repayWrite, isLoading: isRepaying } = useContractWrite({
    address: CONTRACTS.DEFI_PROTOCOL,
    abi: DeFiProtocolABI,
    functionName: 'repay',
    onSuccess: () => {
      toast.success('Repayment successful!');
      refetchPosition();
      setAmount('');
    },
    onError: (error) => {
      toast.error(`Repayment failed: ${error.message}`);
    },
  });

  // Handle transactions
  const handleDeposit = useCallback(async () => {
    if (!selectedToken || !amount || !contract) return;

    try {
      const amountBN = ethers.utils.parseUnits(amount, selectedToken.decimals);

      // Check allowance
      const currentAllowance = allowance as ethers.BigNumber;
      if (!currentAllowance || currentAllowance.lt(amountBN)) {
        await approveToken.mutateAsync({
          tokenAddress: selectedToken.address,
          spenderAddress: CONTRACTS.DEFI_PROTOCOL,
          amount: ethers.constants.MaxUint256.toString(),
        });
      }

      depositWrite({
        args: [selectedToken.address, amountBN],
      });
    } catch (error) {
      console.error('Deposit error:', error);
    }
  }, [selectedToken, amount, contract, allowance, approveToken, depositWrite]);

  const handleBorrow = useCallback(async () => {
    if (!selectedToken || !amount) return;

    try {
      const amountBN = ethers.utils.parseUnits(amount, selectedToken.decimals);

      borrowWrite({
        args: [selectedToken.address, amountBN],
      });
    } catch (error) {
      console.error('Borrow error:', error);
    }
  }, [selectedToken, amount, borrowWrite]);

  const handleWithdraw = useCallback(async () => {
    if (!selectedToken || !amount) return;

    try {
      const amountBN = ethers.utils.parseUnits(amount, selectedToken.decimals);

      withdrawWrite({
        args: [selectedToken.address, amountBN],
      });
    } catch (error) {
      console.error('Withdraw error:', error);
    }
  }, [selectedToken, amount, withdrawWrite]);

  const handleRepay = useCallback(async () => {
    if (!selectedToken || !amount) return;

    try {
      const amountBN = ethers.utils.parseUnits(amount, selectedToken.decimals);

      // Check allowance
      const currentAllowance = allowance as ethers.BigNumber;
      if (!currentAllowance || currentAllowance.lt(amountBN)) {
        await approveToken.mutateAsync({
          tokenAddress: selectedToken.address,
          spenderAddress: CONTRACTS.DEFI_PROTOCOL,
          amount: ethers.constants.MaxUint256.toString(),
        });
      }

      repayWrite({
        args: [selectedToken.address, amountBN],
      });
    } catch (error) {
      console.error('Repay error:', error);
    }
  }, [selectedToken, amount, allowance, approveToken, repayWrite]);

  // Wallet connection UI
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Connect Your Wallet</h1>
          <div className="space-y-3">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                disabled={!connector.ready}
                onClick={() => connect({ connector })}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {connector.name}
                {!connector.ready && ' (unsupported)'}
                {isLoading && connector.id === pendingConnector?.id && ' (connecting)'}
              </button>
            ))}
          </div>
          {error && <div className="mt-4 text-red-600 text-sm">{error.message}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">DeFi Protocol</h1>
            <div className="text-sm text-gray-600">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Position Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Your Position</h2>
              {positionLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : userPosition ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Collateral Value:</span>
                    <span className="font-medium">${parseFloat(userPosition.collateralValue).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Borrowed Value:</span>
                    <span className="font-medium">${parseFloat(userPosition.borrowValue).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Health Factor:</span>
                    <span className={`font-medium ${
                      userPosition.healthFactor > 1.5 ? 'text-green-600' :
                      userPosition.healthFactor > 1.2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {userPosition.healthFactor === Infinity ? '∞' : userPosition.healthFactor.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-medium mb-2">Deposits</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>USDC:</span>
                        <span>{parseFloat(userPosition.deposits.USDC).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>WETH:</span>
                        <span>{parseFloat(userPosition.deposits.WETH).toFixed(6)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Borrowed</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>USDC:</span>
                        <span>{parseFloat(userPosition.borrowed.USDC).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>WETH:</span>
                        <span>{parseFloat(userPosition.borrowed.WETH).toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  No position data available
                </div>
              )}
            </div>
          </div>

          {/* Transaction Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Tab Header */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6 pt-6">
                  <button
                    onClick={() => setActiveTab('deposit')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'deposit'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Deposit & Withdraw
                  </button>
                  <button
                    onClick={() => setActiveTab('borrow')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'borrow'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Borrow & Repay
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Token Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Token
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {tokens.map((token) => (
                        <button
                          key={token.address}
                          onClick={() => setSelectedToken(token)}
                          className={`p-4 border-2 rounded-lg text-left ${
                            selectedToken?.address === token.address
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-sm text-gray-500">{token.name}</div>
                          {tokenBalance && (
                            <div className="text-sm text-gray-600 mt-1">
                              Balance: {parseFloat(tokenBalance.formatted).toFixed(6)}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {selectedToken && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          {selectedToken.symbol}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    {activeTab === 'deposit' ? (
                      <>
                        <button
                          onClick={handleDeposit}
                          disabled={!selectedToken || !amount || isDepositing}
                          className="py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDepositing ? 'Depositing...' : 'Deposit'}
                        </button>
                        <button
                          onClick={handleWithdraw}
                          disabled={!selectedToken || !amount || isWithdrawing}
                          className="py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleBorrow}
                          disabled={!selectedToken || !amount || isBorrowing}
                          className="py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isBorrowing ? 'Borrowing...' : 'Borrow'}
                        </button>
                        <button
                          onClick={handleRepay}
                          disabled={!selectedToken || !amount || isRepaying}
                          className="py-3 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isRepaying ? 'Repaying...' : 'Repay'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeFiDashboard;
```

## Skill Activation Triggers

This skill automatically activates when:
- Smart contract development is needed
- DeFi protocol implementation is requested
- NFT marketplace development is required
- Web3 frontend integration is needed
- Blockchain security auditing is requested
- Cross-chain bridge development is required

This comprehensive blockchain and Web3 skill provides expert-level capabilities for building modern decentralized applications using cutting-edge blockchain technologies and security practices.