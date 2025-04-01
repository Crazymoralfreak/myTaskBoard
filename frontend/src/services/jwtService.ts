import axios, { AxiosError, AxiosInstance } from 'axios';
import { refreshToken } from './authService';

export class JwtService {
    private static instance: JwtService;
    private axiosInstance: AxiosInstance;
    private isRefreshing = false;
    private refreshSubscribers: ((token: string) => void)[] = [];

    private constructor() {
        this.axiosInstance = axios.create({
            baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8081',
            headers: {
                'Accept': 'application/json'
            },
            withCredentials: true
        });

        this.setupInterceptors();
    }

    public static getInstance(): JwtService {
        if (!JwtService.instance) {
            JwtService.instance = new JwtService();
        }
        return JwtService.instance;
    }

    public getAxiosInstance(): AxiosInstance {
        return this.axiosInstance;
    }

    private setupInterceptors(): void {
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config;
                
                if (error.response?.status === 401 && !this.isRefreshing) {
                    this.isRefreshing = true;

                    try {
                        const newToken = await refreshToken();
                        localStorage.setItem('token', newToken);
                        
                        if (originalRequest?.headers) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        }
                        
                        this.onRefreshSuccess(newToken);
                        return this.axiosInstance(originalRequest!);
                    } catch (refreshError) {
                        this.onRefreshFailure(refreshError as Error);
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    private onRefreshSuccess(token: string): void {
        this.refreshSubscribers.forEach((callback) => callback(token));
        this.refreshSubscribers = [];
    }

    private onRefreshFailure(error: Error): void {
        this.refreshSubscribers = [];
        localStorage.removeItem('token');
        window.location.href = '/login';
    }

    public addRefreshSubscriber(callback: (token: string) => void): void {
        this.refreshSubscribers.push(callback);
    }

    private getAxiosInstanceWithoutToken() {
        return axios.create({
            baseURL: 'http://localhost:8081',
            headers: {
                'Accept': 'application/json'
            }
        });
    }
} 