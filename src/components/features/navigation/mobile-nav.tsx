'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CollectionList } from '@/features/collections/components/collection-list';

interface Collection {
  id: string;
  name: string;
}

interface MobileNavProps {
  collections: Collection[];
}

export function MobileNav({ collections }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-[#DCD7BA] hover:bg-[#2D4F67]">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Collections</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[300px] bg-[#1F1F28] border-[#16161D] p-0 h-[80vh] flex flex-col">
        <DialogHeader className="p-4 border-b border-[#16161D]">
          <DialogTitle className="text-[#DCD7BA]">Collections</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-2">
          <CollectionList 
            collections={collections} 
            onSelect={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
