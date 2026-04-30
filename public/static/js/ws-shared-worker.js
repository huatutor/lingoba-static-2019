// WebSocket SharedWorker
// 用于在多个标签页之间共享WebSocket连接

let ws = null;
let ports = [];
let reconnectTimer = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectInterval = 3000;
let heartbeatInterval = null;
const heartbeatDelay = 30000; // 30秒心跳间隔

// 连接WebSocket
function connectWebSocket(wsshost, uid, type = 'data') {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
        console.log('WebSocket已连接或正在连接中');
        return;
    }

    const wsUrl = `${wsshost}?uid=${uid}&type=${type}`;
    console.log('SharedWorker连接WebSocket:', wsUrl);
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function(event) {
        console.log('SharedWorker WebSocket连接已建立');
        reconnectAttempts = 0;
        
        // 启动心跳机制
        startHeartbeat();
        
        // 通知所有端口连接成功
        broadcastToAllPorts({
            type: 'ws-connected',
            data: event
        });
    };
    
    ws.onmessage = function(event) {
        console.log('SharedWorker收到WebSocket消息:', event.data);
        
        // 广播消息到所有连接的端口
        broadcastToAllPorts({
            type: 'ws-message',
            data: event.data
        });
    };
    
    ws.onclose = function(event) {
        console.log('SharedWorker WebSocket连接关闭:', event.code, event.reason);
        
        // 停止心跳机制
        stopHeartbeat();
        
        // 通知所有端口连接关闭
        broadcastToAllPorts({
            type: 'ws-closed',
            data: { code: event.code, reason: event.reason }
        });
        
        // 尝试重连
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`尝试重连 (${reconnectAttempts}/${maxReconnectAttempts})`);
            
            reconnectTimer = setTimeout(() => {
                connectWebSocket(wsshost, uid, type);
            }, reconnectInterval);
        }
    };
    
    ws.onerror = function(error) {
        console.error('SharedWorker WebSocket错误:', error);
        
        // 通知所有端口发生错误
        broadcastToAllPorts({
            type: 'ws-error',
            data: error
        });
    };
}

// 向所有端口广播消息
function broadcastToAllPorts(message) {
    ports.forEach(port => {
        try {
            port.postMessage(message);
        } catch (e) {
            console.error('向端口发送消息失败:', e);
        }
    });
}

// 发送消息到WebSocket
function sendMessage(message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        return true;
    } else {
        console.warn('WebSocket未连接，无法发送消息');
        return false;
    }
}

// 处理新的端口连接
self.onconnect = function(e) {
    const port = e.ports[0];
    ports.push(port);
    
    console.log('新的端口连接到SharedWorker，当前端口数量:', ports.length);
    
    port.onmessage = function(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'connect':
                // 连接WebSocket
                const { wsshost, uid, wstype } = data;
                connectWebSocket(wsshost, uid, wstype);
                break;
                
            case 'send':
                // 发送消息
                const success = sendMessage(data.message);
                port.postMessage({
                    type: 'send-result',
                    data: { success }
                });
                break;
                
            case 'disconnect':
                // 断开连接
                if (ws) {
                    ws.close();
                }
                break;
                
            case 'ping':
                // 心跳检测
                port.postMessage({
                    type: 'pong',
                    data: { timestamp: Date.now() }
                });
                break;
                
            default:
                console.warn('未知的消息类型:', type);
        }
    };
    
    port.onmessageerror = function(error) {
        console.error('端口消息错误:', error);
    };
    
    // 端口关闭时清理
    port.addEventListener('close', function() {
        const index = ports.indexOf(port);
        if (index > -1) {
            ports.splice(index, 1);
        }
        console.log('端口已关闭，剩余端口数量:', ports.length);
        
        // 如果没有端口连接了，关闭WebSocket
        if (ports.length === 0 && ws) {
            console.log('所有端口已关闭，断开WebSocket连接');
            ws.close();
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
        }
    });
    
    // 发送当前WebSocket状态
    if (ws) {
        port.postMessage({
            type: 'ws-status',
            data: {
                readyState: ws.readyState,
                url: ws.url
            }
        });
    }
    
    port.start();
};

// 启动心跳机制
function startHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    
    heartbeatInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('发送心跳ping');
            ws.send('ping');
        }
    }, heartbeatDelay);
}

// 停止心跳机制
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        // console.log('心跳机制已停止');
    }
}