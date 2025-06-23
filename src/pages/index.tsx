import React, { useState, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import classNames from "classnames";
import { AiOutlineInfoCircle } from "react-icons/ai";
import {
  BsFileEarmark,
  BsCheckCircle,
  BsFlag,
  BsPencil,
  BsClipboard,
  BsFiles,
  BsTrash,
} from "react-icons/bs";

// Types
type Page = { id: string; name: string };

interface PageButtonProps {
  page: Page;
  index: number;
  movePage: (from: number, to: number) => void;
  setActive: (id: string) => void;
  activeId: string;
  focusedId: string | null;
  onMenuOpen: (id: string, position: { top: number; left: number }) => void;
}

interface ContextMenuProps {
  position: { top: number; left: number };
  onClose: () => void;
}

// Page Names
const PAGE_TYPES = ["Info", "Details", "Other", "Ending"];

// Page Button
const PageButton: React.FC<PageButtonProps> = ({
  page,
  index,
  movePage,
  setActive,
  activeId,
  onMenuOpen,
  focusedId,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: "PAGE",
    hover(item: any) {
      if (item.index === index) return;
      movePage(item.index, index);
      item.index = index;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "PAGE",
    item: { id: page.id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  const isActive = page.id === activeId;
  const isFocused = page.id === focusedId;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        className={classNames("page-button", {
          active: isActive,
          focused: isFocused,
          dragging: isDragging,
        })}
        onClick={() => setActive(page.id)}
        onFocus={() => setActive(page.id)}
      >
        <span className="page-icon">
          {page.name === "Info" ? (
            <AiOutlineInfoCircle />
          ) : page.name === "Ending" ? (
            <BsCheckCircle />
          ) : (
            <BsFileEarmark />
          )}
        </span>
        {page.name}
      </button>
      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const rect = ref.current?.getBoundingClientRect();
            if (rect) {
              onMenuOpen(page.id, {
                top: rect.bottom + 4,
                left: rect.left,
              });
            }
          }}
          style={{
            position: "absolute",
            top: "22%",
            right: 0,
            background: "none",
            border: "none",
            color: "#999",
          }}
        >
          ⋮
        </button>
      )}
    </div>
  );
};

// Add Page Button
const AddButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button className="add-button" onClick={onClick}>
    +
  </button>
);

// Context Menu
const ContextMenu: React.FC<{
  position: { top: number; left: number };
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}> = ({ position, onClose, onRename, onDelete, onDuplicate }) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [onClose]);

  return (
    <div
      className="context-menu"
      style={{ top: position.top, left: position.left, position: "absolute" }}
    >
      <div className="context-menu-title">Settings</div>
      <button>
        <BsFlag /> Set as first page
      </button>
      <button onClick={onRename}>
        <BsPencil /> Rename
      </button>
      <button>
        <BsClipboard /> Copy
      </button>
      <button onClick={onDuplicate}>
        <BsFiles /> Duplicate
      </button>
      <hr />
      <button className="danger" onClick={onDelete}>
        <BsTrash /> Delete
      </button>
    </div>
  );
};

// Main Page Manager
const PageManager = () => {
  const [pages, setPages] = useState<Page[]>(
    PAGE_TYPES.map((name) => ({ id: uuidv4(), name }))
  );
  const [activeId, setActiveId] = useState(pages[0].id);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [menuPageId, setMenuPageId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  const movePage = (fromIndex: number, toIndex: number) => {
    const updated = [...pages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setPages(updated);
  };

  const addPageAt = (index: number) => {
    const newPage = { id: uuidv4(), name: "New Page" };
    const updated = [...pages];
    updated.splice(index, 0, newPage);
    setPages(updated);
  };

  const handleMenuOpen = (
    id: string,
    position: { top: number; left: number }
  ) => {
    setMenuPosition(position);
    setMenuPageId(id);
  };

  const handleRename = () => {
    const newName = prompt("Enter new page name:");
    if (newName && menuPageId) {
      setPages((prev) =>
        prev.map((page) =>
          page.id === menuPageId ? { ...page, name: newName } : page
        )
      );
    }
  };

  const handleDelete = () => {
    setPages(pages.filter((page) => page.id !== menuPageId));
    setMenuPageId(null);
  };

  const handleDuplicate = () => {
    const original = pages.find((page) => page.id === menuPageId);
    if (!original) return;
    const newPage = { id: uuidv4(), name: `${original.name} Copy` };
    const index = pages.findIndex((page) => page.id === menuPageId);
    const updated = [...pages];
    updated.splice(index + 1, 0, newPage);
    setPages(updated);
    setMenuPageId(null);
  };

  return (
    <div>
      <div className="page-row">
        {pages.map((page, idx) => (
          <React.Fragment key={page.id}>
            <PageButton
              page={page}
              index={idx}
              movePage={movePage}
              setActive={(id) => {
                setActiveId(id);
                setFocusedId(id);
              }}
              activeId={activeId}
              focusedId={focusedId}
              onMenuOpen={handleMenuOpen}
            />
            {idx < pages.length - 1 && (
              <AddButton onClick={() => addPageAt(idx + 1)} />
            )}
          </React.Fragment>
        ))}
        <AddButton onClick={() => addPageAt(pages.length)} />
      </div>
      {menuPageId && (
        <ContextMenu
          position={menuPosition}
          onClose={() => setMenuPageId(null)}
          onRename={handleRename}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      )}
    </div>
  );
};

// Main Page Component
export default function Home() {
  return (
    <DndProvider backend={HTML5Backend}>
      <PageManager />
    </DndProvider>
  );
}
