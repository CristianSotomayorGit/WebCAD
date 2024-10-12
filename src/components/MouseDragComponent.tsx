import React, { useState, useEffect } from 'react';

const MouseDragComponent: React.FC = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseDown = (event: MouseEvent) => {
            setIsDragging(true);
            setLastMousePosition({ x: event.clientX, y: event.clientY });
        };

        const handleMouseMove = (event: MouseEvent) => {
            if (isDragging) {
                const deltaX = event.clientX - lastMousePosition.x;
                const deltaY = event.clientY - lastMousePosition.y;

                // Do something with the delta values
                console.log(`Dragging... deltaX: ${deltaX}, deltaY: ${deltaY}`);

                // Update the last mouse position
                setLastMousePosition({ x: event.clientX, y: event.clientY });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        // Cleanup event listeners on unmount
        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, lastMousePosition]);

    return (
        <div style={{ width: '100vw', height: '100vh', cursor: isDragging ? 'grabbing' : 'grab' }}>
            {isDragging ? 'Dragging...' : 'Not dragging'}
        </div>
    );
};

export default MouseDragComponent;
