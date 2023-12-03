type ConnectionStatus = {
    [key: number] : string;
};

export const connectionStatus : ConnectionStatus = {
    0: 'Offline 🔴',
    1: 'Online 🟢',
    2: 'In game 🕹️',
    3: 'Checking... 🟡',
};