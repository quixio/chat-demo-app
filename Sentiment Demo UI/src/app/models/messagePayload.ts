export interface MessagePayload {
	name: string;
	profilePic?: string;
	value?: string;
	sentiment?: number;
	timestamp: number;
}