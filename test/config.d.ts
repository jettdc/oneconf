export declare type Config = {
    redis: {
        hostName: string;
        port: number;
        socket: {
            test: string;
            testBoolean: boolean;
        };
    };
    fat: Fatty;
};
declare type Fatty = {
    a: string;
    b: string;
};
export {};
