import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Timestamp "mo:core/Time";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import Order "mo:core/Order";

actor {
  // AUTHORIZATION
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // TYPES
  public type Company = {
    id : Nat;
    symbol : Text;
    name : Text;
    sector : Text;
    industry : Text;
    marketCap : Float;
    price : Float;
    pe : Float;
    pb : Float;
    roe : Float;
    roce : Float;
    debtEquity : Float;
    dividendYield : Float;
    eps : Float;
    revenue : Float;
    netProfit : Float;
    revenueGrowth : Float;
    profitGrowth : Float;
    high52w : Float;
    low52w : Float;
  };

  module Company {
    public func compare(a : Company, b : Company) : Order.Order {
      Text.compare(a.symbol, b.symbol);
    };
  };

  public type Financial = {
    companyId : Nat;
    period : Text;
    periodType : Text;
    revenue : Float;
    netProfit : Float;
    ebitda : Float;
    eps : Float;
    totalAssets : Float;
    totalDebt : Float;
    cashFromOperations : Float;
  };

  module Financial {
    public func compareByPeriod(a : Financial, b : Financial) : Order.Order {
      Text.compare(b.period, a.period);
    };
  };

  public type Watchlist = {
    id : Nat;
    userId : User;
    name : Text;
    symbols : [Symbol];
  };

  module Watchlist {
    public func compareById(a : Watchlist, b : Watchlist) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  public type PortfolioEntry = {
    id : Nat;
    userId : User;
    symbol : Symbol;
    companyName : Text;
    quantity : Float;
    avgCost : Float;
    buyDate : Text;
  };

  module PortfolioEntry {
    public func compareById(a : PortfolioEntry, b : PortfolioEntry) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  public type UserProfile = {
    name : Text;
    email : Text;
  };

  module UserProfile {
    public func compare(a : UserProfile, b : UserProfile) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  public type LiveQuote = {
    symbol : Text;
    price : ?Float;
    marketCap : ?Float;
    pe : ?Float;
    high52w : ?Float;
    low52w : ?Float;
    change : ?Float;
    changePercent : ?Float;
    lastUpdated : Int;
    dataSource : Text;
  };

  public type ScreenerParams = {
    minPE : ?Float;
    maxPE : ?Float;
    minROE : ?Float;
    minROCE : ?Float;
    maxDebtEquity : ?Float;
    minPB : ?Float;
    maxPB : ?Float;
    minMarketCap : ?Float;
    maxMarketCap : ?Float;
    sector : ?Text;
  };

  type Symbol = Text;
  type User = Principal;
  type Timestamp = Int;

  // State variables
  let companies = Map.empty<Symbol, Company>();
  let financials = Map.empty<Nat, List.List<Financial>>();
  let watchlists = Map.empty<Nat, Watchlist>();
  let portfolios = Map.empty<User, List.List<PortfolioEntry>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextWatchlistId = 1;
  var nextPortfolioEntryId = 1;
  let liveQuoteCache = Map.empty<Symbol, (LiveQuote, Timestamp)>();
  let timestampCache = Map.empty<Symbol, Int>();

  // HTTP transform callback for OutCall
  public query ({ caller = _ }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Yahoo Finance HTTP Outcall with caching and fallback
  // Public access - market data should be available to all users including guests
  public shared ({ caller }) func fetchLiveQuote(symbol : Text) : async LiveQuote {
    let now = Timestamp.now();
    let cacheKey = symbol # ".NS";
    switch (liveQuoteCache.get(cacheKey)) {
      case (?(quote, ts)) {
        if (Int.abs(now - ts) < 900_000_000_000) {
          return { quote with dataSource = "cached" };
        };
      };
      case (null) {};
    };

    try {
      let url = "https://query1.finance.yahoo.com/v8/finance/chart/" # symbol # "?interval=1d&range=5d";
      let response = await OutCall.httpGetRequest(url, [], transform);
      let price = parseYahooPrice(response);
      let marketCap = parseYahooMarketCap(response);
      let pe = parseYahooPE(response);

      let quote : LiveQuote = {
        symbol;
        price;
        marketCap;
        pe;
        high52w = searchHigh52w(symbol);
        low52w = searchLow52w(symbol);
        change = parseYahooChange(response);
        changePercent = parseYahooChangePercent(response);
        lastUpdated = now;
        dataSource = "live";
      };

      liveQuoteCache.add(cacheKey, (quote, now));
      quote;
    } catch (err) {
      switch (liveQuoteCache.get(cacheKey)) {
        case (?(quote, _)) {
          liveQuoteCache.add(cacheKey, (quote, now));
          { quote with dataSource = "fallback:cached_data" };
        };
        case (null) {
          { symbol; price = null; marketCap = null; pe = null; high52w = null; low52w = null; change = null; changePercent = null; lastUpdated = now; dataSource = "offline" };
        };
      };
    };
  };

  // Helper parse functions for Yahoo Response
  func parseYahooPrice(_response : Text) : ?Float {
    null;
  };
  func parseYahooMarketCap(_response : Text) : ?Float {
    null;
  };
  func parseYahooPE(_response : Text) : ?Float {
    null;
  };
  func parseYahooChange(_response : Text) : ?Float {
    null;
  };
  func parseYahooChangePercent(_response : Text) : ?Float {
    null;
  };

  // Helper functions for 52 week high/low
  func searchHigh52w(symbol : Text) : ?Float {
    switch (companies.get(symbol)) {
      case (?company) { ?company.high52w };
      case (null) { null };
    };
  };
  func searchLow52w(symbol : Text) : ?Float {
    switch (companies.get(symbol)) {
      case (?company) { ?company.low52w };
      case (null) { null };
    };
  };

  // User profile functions
  // Public registration - anyone can register
  public shared ({ caller }) func registerUser(name : Text, email : Text) : async () {
    if (userProfiles.containsKey(caller)) {
      Runtime.trap("User already exists");
    };
    let newProfile : UserProfile = { name; email };
    userProfiles.add(caller, newProfile);
  };

  // Get another user's profile - requires admin or self
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Save caller's own profile - requires user role
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Get caller's own profile - requires user role
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  // Update caller's own profile - requires user role
  public shared ({ caller }) func updateUserProfile(newName : Text, newEmail : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let updatedProfile = { profile with name = newName; email = newEmail };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  // Admin-only: Get all user profiles
  public query ({ caller }) func getAllUserProfiles() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all profiles");
    };
    userProfiles.values().toArray().sort();
  };

  public type UserRole = {
    #admin;
    #user;
    #guest;
  };

  // Public - anyone can check their own role
  public query ({ caller }) func getUserRole() : async UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  // Companies - public read access for all users including guests
  public query ({ caller }) func getAllCompanies() : async [Company] {
    companies.values().toArray().sort();
  };

  public query ({ caller }) func getCompany(symbol : Symbol) : async Company {
    switch (companies.get(symbol)) {
      case (?company) { company };
      case (null) { Runtime.trap("Company not found") };
    };
  };

  public query ({ caller }) func getCompaniesBySector(sector : Text) : async [Company] {
    companies.values().toArray().filter(
      func(c) { Text.equal(c.sector, sector) }
    );
  };

  public query ({ caller }) func getSectors() : async [Text] {
    let sectorSet = Map.empty<Text, Bool>();
    for (c in companies.values()) {
      sectorSet.add(c.sector, true);
    };
    sectorSet.keys().toArray();
  };

  // Stock screener function - public access
  public query ({ caller }) func screenStocks(params : ScreenerParams) : async [Company] {
    companies.values().toArray().filter(
      func(c) {
        switch (params.minPE) {
          case (null) {};
          case (?v) { if (c.pe < v) { return false } };
        };
        switch (params.maxPE) {
          case (null) {};
          case (?v) { if (c.pe > v) { return false } };
        };
        switch (params.minROE) {
          case (null) {};
          case (?v) { if (c.roe < v) { return false } };
        };
        switch (params.minROCE) {
          case (null) {};
          case (?v) { if (c.roce < v) { return false } };
        };
        switch (params.minMarketCap) {
          case (null) {};
          case (?v) { if (c.marketCap < v) { return false } };
        };
        switch (params.maxMarketCap) {
          case (null) {};
          case (?v) { if (c.marketCap > v) { return false } };
        };
        switch (params.minPB) {
          case (null) {};
          case (?v) { if (c.pb < v) { return false } };
        };
        switch (params.maxPB) {
          case (null) {};
          case (?v) { if (c.pb > v) { return false } };
        };
        switch (params.maxDebtEquity) {
          case (null) {};
          case (?v) { if (c.debtEquity > v) { return false } };
        };
        switch (params.sector) {
          case (null) {};
          case (?v) { if (not Text.equal(c.sector, v)) { return false } };
        };
        true;
      }
    );
  };

  // Portfolio functions - require user role and ownership verification
  public shared ({ caller }) func addPortfolioEntry(symbol : Symbol, companyName : Text, quantity : Float, avgCost : Float, buyDate : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let id = nextPortfolioEntryId;
    nextPortfolioEntryId += 1;
    let entry : PortfolioEntry = {
      id;
      userId = caller;
      symbol;
      companyName;
      quantity;
      avgCost;
      buyDate;
    };

    switch (portfolios.get(caller)) {
      case (null) {
        let list = List.empty<PortfolioEntry>();
        list.add(entry);
        portfolios.add(caller, list);
      };
      case (?entries) {
        entries.add(entry);
      };
    };
    id;
  };

  public query ({ caller }) func getUserPortfolio() : async [PortfolioEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    switch (portfolios.get(caller)) {
      case (?entries) { entries.toArray().sort(PortfolioEntry.compareById) };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func removePortfolioEntry(entryId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    switch (portfolios.get(caller)) {
      case (null) { Runtime.trap("Portfolio not found") };
      case (?entries) {
        let filtered = entries.filter(func(e) { e.id != entryId });
        portfolios.add(caller, filtered);
      };
    };
  };

  // Watchlists - require user role and ownership verification
  public shared ({ caller }) func createWatchlist(name : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create watchlists");
    };
    let id = nextWatchlistId;
    nextWatchlistId += 1;
    let wl : Watchlist = {
      id;
      userId = caller;
      name;
      symbols = [];
    };
    watchlists.add(id, wl);
    id;
  };

  public query ({ caller }) func getUserWatchlists() : async [Watchlist] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    watchlists.values().toArray().filter(
      func(wl) { wl.userId == caller }
    );
  };

  public shared ({ caller }) func addToWatchlist(watchlistId : Nat, symbol : Symbol) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    switch (watchlists.get(watchlistId)) {
      case (null) { Runtime.trap("Watchlist not found") };
      case (?wl) {
        if (wl.userId != caller) { Runtime.trap("Unauthorized: Not owner") };
        let newSymbols = wl.symbols.concat([symbol]);
        let updated = { wl with symbols = newSymbols };
        watchlists.add(watchlistId, updated);
      };
    };
  };

  public shared ({ caller }) func removeFromWatchlist(watchlistId : Nat, symbol : Symbol) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    switch (watchlists.get(watchlistId)) {
      case (null) { Runtime.trap("Watchlist not found") };
      case (?wl) {
        if (wl.userId != caller) { Runtime.trap("Unauthorized: Not owner") };
        let newSymbols = wl.symbols.filter(func(s) { s != symbol });
        let updated = { wl with symbols = newSymbols };
        watchlists.add(watchlistId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteWatchlist(watchlistId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    switch (watchlists.get(watchlistId)) {
      case (null) { Runtime.trap("Watchlist not found") };
      case (?wl) {
        if (wl.userId != caller) { Runtime.trap("Unauthorized: Not owner") };
        watchlists.remove(watchlistId);
      };
    };
  };

  // Financials - public read access
  public query ({ caller }) func getFinancials(companyId : Nat) : async [Financial] {
    switch (financials.get(companyId)) {
      case (null) { [] };
      case (?finList) { finList.toArray().sort(Financial.compareByPeriod) };
    };
  };

  // ADMIN FUNCTIONS - require admin role
  public shared ({ caller }) func deleteCompany(symbol : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete companies");
    };
    companies.remove(symbol);
  };

  public shared ({ caller }) func adminDeleteUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete users");
    };
    userProfiles.remove(user);
    portfolios.remove(user);
  };

  public shared ({ caller }) func adminAddCompany(company : Company) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add companies");
    };
    companies.add(company.symbol, company);
  };

  public query ({ caller }) func adminListAllUsers() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list all users");
    };
    userProfiles.keys().toArray();
  };

  system func preupgrade() {};
  system func postupgrade() {};
};
