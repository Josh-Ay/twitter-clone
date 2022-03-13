import {  useEffect } from "react";

export default function useTitle(title) {

    // useEffect hook to update the title of pages
    useEffect( () => {
        document.title = title;
    }, [title])

}
