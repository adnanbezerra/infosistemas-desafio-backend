import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect } from 'amqplib';

type EventPayload = Record<string, unknown>;

@Injectable()
export class MessagingService implements OnModuleDestroy {
    private readonly logger = new Logger(MessagingService.name);
    private connection?: ChannelModel;
    private channel?: Channel;

    constructor(private readonly configService: ConfigService) {}

    async publish(routingKey: string, payload: EventPayload): Promise<void> {
        try {
            const channel = await this.getChannel();
            const exchange =
                this.configService.getOrThrow<string>('RABBITMQ_EXCHANGE');

            channel.publish(
                exchange,
                routingKey,
                Buffer.from(
                    JSON.stringify({
                        event: routingKey,
                        occurredAt: new Date().toISOString(),
                        payload,
                    }),
                ),
                {
                    contentType: 'application/json',
                    persistent: true,
                },
            );
        } catch (error) {
            this.logger.warn(
                `Could not publish RabbitMQ event ${routingKey}: ${
                    error instanceof Error ? error.message : 'unknown error'
                }`,
            );
        }
    }

    async onModuleDestroy(): Promise<void> {
        await this.channel?.close().catch(() => undefined);
        await this.connection?.close().catch(() => undefined);
    }

    private async getChannel(): Promise<Channel> {
        if (this.channel) {
            return this.channel;
        }

        const url = this.configService.getOrThrow<string>('RABBITMQ_URL');
        const exchange =
            this.configService.getOrThrow<string>('RABBITMQ_EXCHANGE');

        this.connection = await connect(url);
        this.connection.on('close', () => {
            this.channel = undefined;
            this.connection = undefined;
        });
        this.connection.on('error', (error) => {
            this.logger.warn(`RabbitMQ connection error: ${error.message}`);
        });

        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(exchange, 'topic', {
            durable: true,
        });

        return this.channel;
    }
}
