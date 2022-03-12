import { useEffect, useState } from "react";

export default function useChangeElementPropertyOnScroll (referenceToElement, propertyToChange, valueToChangeToOnScrollUp, valueToChangeToOnScrollDown, specifyBoundary) {
    // using a hook to track the vertical window scroll height
    const [currentHeight, setCurrentHeight] = useState(window.scrollY);

    // using a variable to a bounding height
    const boundaryHeight = Math.round( 0.25 * window.innerHeight );

    useEffect( () => {
        const checkScrollDirection = (e) => {
            // update the current height on scroll
            setCurrentHeight(window.scrollY);

            // if the current reference element is 'null', then do not do anything
            if (!referenceToElement.current) return;

            // if 'specifyBoundary' parameter was passed
            if (specifyBoundary){

                // if the reference to the element is not 'null' and the current scroll height has passed the boundary height
                if (currentHeight > boundaryHeight) return referenceToElement.current.style[`${propertyToChange}`] = valueToChangeToOnScrollUp;

                // if the reference to the element is not 'null' and the current scroll height has not reached the boundary height
                return referenceToElement.current.style[`${propertyToChange}`] = valueToChangeToOnScrollDown;
            }
            
            // if the reference element is not 'null' and an upward scroll was made, update the passed property(i.e. 'propertyToChange') to the corresponding value (i.e, 'valueToChangeOnScrollUp')
            if (currentHeight > window.scrollY) return referenceToElement.current.style[`${propertyToChange}`] = valueToChangeToOnScrollUp;

            // if the reference element is not 'null' and a downward scroll was made, update the passed property(i.e. 'propertyToChange') to the corresponding value (i.e, 'valueToChangeOnScrollDown')
            return referenceToElement.current.style[`${propertyToChange}`] = valueToChangeToOnScrollDown;
        }
        window.addEventListener("scroll", checkScrollDirection, true);

        return () =>{
            window.removeEventListener("scroll", checkScrollDirection, true);
        }
    }, [referenceToElement, currentHeight, propertyToChange, valueToChangeToOnScrollDown, valueToChangeToOnScrollUp, boundaryHeight, specifyBoundary])
};
