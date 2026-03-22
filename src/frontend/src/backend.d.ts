import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ScreenerParams {
    maxPB?: number;
    maxPE?: number;
    maxDebtEquity?: number;
    minPB?: number;
    minPE?: number;
    minROCE?: number;
    minROE?: number;
    minMarketCap?: number;
    sector?: string;
    maxMarketCap?: number;
}
export type Symbol = string;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type User = Principal;
export interface LiveQuote {
    pe?: number;
    dataSource: string;
    marketCap?: number;
    lastUpdated: bigint;
    low52w?: number;
    high52w?: number;
    change?: number;
    price?: number;
    changePercent?: number;
    symbol: string;
}
export interface Watchlist {
    id: bigint;
    symbols: Array<Symbol>;
    userId: User;
    name: string;
}
export interface Company {
    id: bigint;
    pb: number;
    pe: number;
    eps: number;
    roe: number;
    debtEquity: number;
    revenue: number;
    profitGrowth: number;
    marketCap: number;
    name: string;
    roce: number;
    sector: string;
    low52w: number;
    high52w: number;
    revenueGrowth: number;
    price: number;
    dividendYield: number;
    symbol: string;
    netProfit: number;
    industry: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface Financial {
    eps: number;
    periodType: string;
    totalAssets: number;
    ebitda: number;
    revenue: number;
    period: string;
    totalDebt: number;
    netProfit: number;
    cashFromOperations: number;
    companyId: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface PortfolioEntry {
    id: bigint;
    userId: User;
    avgCost: number;
    buyDate: string;
    companyName: string;
    quantity: number;
    symbol: Symbol;
}
export interface UserProfile {
    name: string;
    email: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPortfolioEntry(symbol: Symbol, companyName: string, quantity: number, avgCost: number, buyDate: string): Promise<bigint>;
    addToWatchlist(watchlistId: bigint, symbol: Symbol): Promise<void>;
    adminAddCompany(company: Company): Promise<void>;
    adminDeleteUser(user: Principal): Promise<void>;
    adminListAllUsers(): Promise<Array<Principal>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createWatchlist(name: string): Promise<bigint>;
    deleteCompany(symbol: string): Promise<void>;
    deleteWatchlist(watchlistId: bigint): Promise<void>;
    fetchLiveQuote(symbol: string): Promise<LiveQuote>;
    getAllCompanies(): Promise<Array<Company>>;
    getAllUserProfiles(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompaniesBySector(sector: string): Promise<Array<Company>>;
    getCompany(symbol: Symbol): Promise<Company>;
    getFinancials(companyId: bigint): Promise<Array<Financial>>;
    getSectors(): Promise<Array<string>>;
    getUserPortfolio(): Promise<Array<PortfolioEntry>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserRole(): Promise<UserRole>;
    getUserWatchlists(): Promise<Array<Watchlist>>;
    isCallerAdmin(): Promise<boolean>;
    registerUser(name: string, email: string): Promise<void>;
    removeFromWatchlist(watchlistId: bigint, symbol: Symbol): Promise<void>;
    removePortfolioEntry(entryId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    screenStocks(params: ScreenerParams): Promise<Array<Company>>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateUserProfile(newName: string, newEmail: string): Promise<void>;
}
