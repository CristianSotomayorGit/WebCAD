import React from "react";
import { Renderer } from "../../infrastructure/rendering/Renderer";
import styles from "./ViewToolbar.module.css"

interface ViewToolbarProps {
    renderer: Renderer;
    drawGrid: boolean;
    setDrawGrid(drawGrid: boolean): void;
    drawVertices: boolean;
    setDrawVertices(drawVertices: boolean): void;
}

const ViewToolbar: React.FC<ViewToolbarProps> = ({ renderer, drawGrid, setDrawGrid, drawVertices, setDrawVertices }) => {

    const handleChangeDrawGrid = (drawGrid: boolean) => {
        renderer.setDrawGrid(drawGrid)
        setDrawGrid(drawGrid)
    };

    const handleChangeDrawVertices = (drawVertices: boolean) => {
        renderer.setDrawVertices(drawVertices);
        setDrawVertices(drawVertices);
    }

    return (
        <>
            <div className={styles.viewToolbar}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <input onChange={() => handleChangeDrawGrid(!drawGrid)} defaultChecked={drawGrid.valueOf()} type="checkbox" />
                    <p style={{ margin: "5px" }}>Grid</p>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <input onChange={() => handleChangeDrawVertices(!drawVertices)} defaultChecked={drawVertices.valueOf()} type="checkbox" />
                    <p style={{ margin: "5px" }}>Vertices</p>
                </div>
            </div>
        </>
    )
}

export default ViewToolbar