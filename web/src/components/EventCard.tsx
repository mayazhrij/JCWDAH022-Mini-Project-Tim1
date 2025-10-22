// web/src/components/EventCard.tsx

import { Card, Badge, Button } from 'flowbite-react';
import Link from 'next/link';
import { EventResponse } from '@/types/data';

interface EventProps {
    event: EventResponse;
}

const EventCard: React.FC<EventProps> = ({ event }) => {
    // Helper untuk format tanggal
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };
    
    // Tentukan harga termurah untuk tampilan
    const minPrice = event.ticketTypes[0]?.ticketPrice || 0;

    return (
        <Card className="max-w-sm h-full hover:shadow-lg transition-shadow">
            <Link href={`/events/detail?eventId=${event.id}`}>
                <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-2">
                    {event.name}
                </h5>
            </Link>
            <div className="flex flex-col gap-2">
                <p className="font-normal text-gray-700 dark:text-gray-400">
                    Location: {event.location}
                </p>
                <p className="font-normal text-gray-700 dark:text-gray-400">
                    Start Date: {formatDate(event.startDate)}
                </p>
            </div>
            <div className="mt-2 flex justify-between items-center">
                <Badge color="success">
                    {minPrice === 0 ? 'FREE' : `Start from Rp ${minPrice.toLocaleString('id-ID')}`}
                </Badge>
                <Link href={`/events/detail?eventId=${event.id}`} passHref>
                    <Button size="sm">View Details</Button>
                </Link>
            </div>
        </Card>
    );
};

export default EventCard;