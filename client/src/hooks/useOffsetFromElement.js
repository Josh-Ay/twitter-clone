import { useEffect } from "react";

export default function useOffsetFromElement (firstElementReference, secondElementReference, distanceToOffsetBy) {
    useEffect(() => {
        // if there is no reference to the first element, do nothing
        if (!firstElementReference.current) return;
        
        // getting the first element's height
        const firstElementHeight = firstElementReference.current.clientHeight;

        // if there was no 'distanceToOffsetBy' parameter passed and no second element, then offset by the first element's height
        if (!distanceToOffsetBy) return secondElementReference.current.style.top = `${firstElementHeight}px`;
        
        // if there is no reference to the first element, do nothing
        if (!secondElementReference.current) return;
        
        // offset the second element by the 'distanceToOffsetBy' passed plus the first element's height
        secondElementReference.current.style.top = `${firstElementHeight + distanceToOffsetBy}px`;

    }, [firstElementReference, secondElementReference, distanceToOffsetBy])
}
