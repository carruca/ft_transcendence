type ConnectionStatus = {
    [key: number] : string;
};

export const connectionStatus : ConnectionStatus = {
    0: 'Offline 🔴',
    1: 'Online 🟢',
    2: 'Away 🟡',
    3: 'In game 🕹️',
};