import { useEffect } from "react";

export default function useClickOutside(refToElement, handleClickOutside) {

    // using a useEffect hook to monitor changes in and around the element
    useEffect( () => {
        const closeCurrentItem = (e) => {
            if (!refToElement.current) return;

            // if the element being referenced is visible and either the escape key is pressed or an event occurs outside it, then close it
            if( (e.key === "Escape")  || (refToElement.current && !refToElement.current.contains(e.target)) ) handleClickOutside();
        }

        document.addEventListener("click", closeCurrentItem, true);
        document.addEventListener("keydown", closeCurrentItem, true);

        return () => {
            document.removeEventListener("click", closeCurrentItem, true);
            document.removeEventListener("keydown", closeCurrentItem, true);
        }
    }, [refToElement, handleClickOutside])

}
