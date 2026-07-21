import { api } from './api';
import { CreateMessageQueuePayload, MessageQueue, MessageQueueFilters, MessageQueueListResponse } from '@/types/message-queue';
import { MessageLog, MessageLogFilters, MessageLogListResponse } from '@/types/message-log';
function qs(params: object = {}) { const search = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); }); const query = search.toString(); return query ? `?${query}` : ''; }
class MessagingService {
  getQueues(params: MessageQueueFilters = {}) { return api.get<MessageQueueListResponse>(`/messaging/queues${qs(params)}`); }
  getQueue(id: string) { return api.get<MessageQueue>(`/messaging/queues/${id}`); }
  createQueue(data: CreateMessageQueuePayload) { return api.post<{items: MessageQueue[]; count: number}>('/messaging/queues', data); }
  startQueue(id: string) { return api.post<MessageQueue>(`/messaging/queues/${id}/start`, {}); }
  pauseQueue(id: string) { return api.post<MessageQueue>(`/messaging/queues/${id}/pause`, {}); }
  resumeQueue(id: string) { return api.post<MessageQueue>(`/messaging/queues/${id}/resume`, {}); }
  cancelQueue(id: string) { return api.post<MessageQueue>(`/messaging/queues/${id}/cancel`, {}); }
  retryQueue(id: string) { return api.post<MessageQueue>(`/messaging/queues/${id}/retry`, {}); }
  getLogs(params: MessageLogFilters = {}) { return api.get<MessageLogListResponse>(`/messaging/logs${qs(params)}`); }
  getLog(id: string) { return api.get<MessageLog>(`/messaging/logs/${id}`); }
}
export const messagingService = new MessagingService();
