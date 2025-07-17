export interface Outage {
    id: string;
    location: {
        latitude: number;
        longitude: number;
    };
    timestamp: number;
}