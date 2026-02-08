"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateCollectionDialog } from "./create-collection-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { EditCollectionDialog } from "./edit-collection-dialog";
import { deleteCollection } from "../actions";
import { toast } from "sonner";
import { useState } from "react";

type Collection = {
  id: string;
  name: string;
  description: string | null;
};

export function CollectionList({ 
  collections,
  onSelect
}: { 
  collections: Collection[];
  onSelect?: () => void;
}) {
  const searchParams = useSearchParams();
  const currentCollectionId = searchParams.get("collectionId");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-sm font-semibold text-[#DCD7BA]">Collections</h2>
        <CreateCollectionDialog />
      </div>
      <nav className="space-y-1">
        <Link
          href="/"
          onClick={onSelect}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-[#2D4F67]",
            !currentCollectionId ? "bg-[#2D4F67] text-[#DCD7BA]" : "text-[#938AA9]"
          )}
        >
          <FolderOpen className="h-4 w-4" />
          All Prompts
        </Link>
        {collections.map((collection) => (
          <CollectionItem 
            key={collection.id} 
            collection={collection} 
            isActive={currentCollectionId === collection.id} 
            onClick={onSelect}
          />
        ))}
      </nav>
    </div>
  );
}

function CollectionItem({ 
  collection, 
  isActive,
  onClick
}: { 
  collection: Collection; 
  isActive: boolean;
  onClick?: () => void;
}) {
  const [showEdit, setShowEdit] = useState(false);

  const handleDelete = async () => {
    // In a real app, use a proper Dialog. For MVP/CLI, confirm is acceptable if accessible.
    // However, since we have Dialog, maybe we should use it? 
    // Let's stick to window.confirm for speed unless requested otherwise.
    if (!window.confirm(`Delete collection "${collection.name}"?`)) return;
    
    const result = await deleteCollection(collection.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Collection deleted");
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Link
            href={`/?collectionId=${collection.id}`}
            onClick={onClick}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-[#2D4F67]",
              isActive
                ? "bg-[#2D4F67] text-[#DCD7BA]"
                : "text-[#938AA9]"
            )}
          >
            <Folder className="h-4 w-4" />
            {collection.name}
          </Link>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-[#1F1F28] border-[#2D4F67] text-[#DCD7BA]">
          <ContextMenuItem onSelect={() => setShowEdit(true)} className="focus:bg-[#2D4F67] focus:text-[#DCD7BA]">
            Rename
          </ContextMenuItem>
          <ContextMenuItem onSelect={handleDelete} className="text-red-400 focus:text-red-400 focus:bg-[#2D4F67]">
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <EditCollectionDialog 
        collection={collection} 
        open={showEdit} 
        onOpenChange={setShowEdit} 
      />
    </>
  );
}
