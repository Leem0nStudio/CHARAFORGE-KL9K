// This component will display a single DataPack as a card in the marketplace listing.

import React from 'react';
import Link from 'next/link';
import type { DataPack } from '@/types/datapack';

interface DatapackCardProps {
  datapack: DataPack;
}

const DatapackCard: React.FC<DatapackCardProps> = ({ datapack }) => {
  return (
    <Link href={`/datapacks/${datapack.id}`} className="block border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="relative h-48 w-full bg-gray-200 flex items-center justify-center">
        {datapack.coverImageUrl ? (
          <img src={datapack.coverImageUrl} alt={datapack.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-500 text-lg">No Image</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-1 truncate">{datapack.name}</h3>
        <p className="text-gray-600 text-sm mb-2">By {datapack.author}</p>
        <p className="text-gray-700 text-sm line-clamp-2">{datapack.description}</p>
        <div className="mt-3 flex justify-between items-center">
          <span className="text-lg font-bold text-blue-600">
            {datapack.price === 0 ? 'Free' : `$${datapack.price}`}
          </span>
          <span className="text-sm text-gray-500 capitalize">{datapack.type}</span>
        </div>
      </div>
    </Link>
  );
};

export default DatapackCard;
