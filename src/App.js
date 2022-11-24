import './styles/App.css';
import React, { useEffect } from 'react';
import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { NavCube } from "./NavCube/NavCube";
import folder from "./icons/folder.svg"
import packageIcon from "./icons/package.svg"
// Math.floor(Math.random() * (2 - 1 + 1) + 1)

function App() {
  let viewer;
  let ifcModel;
  let ids;
  let sectionBoxMode = false;
  useEffect(() => {
    const container = document.getElementById("viewer-container");
    viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });
    viewer.grid.setGrid();
    viewer.axes.setAxes();
    var model;
    //Nave cube
    viewer.container = container;
    const navCube = new NavCube(viewer);
    navCube.onPick(model);
    window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();
    viewer.clipper.active = true;
  })

  const main = async () => {
    // viewer = await setupScene();
    // const ifcModel = await viewer.IFC.loadIfcUrl('../../../IFC/01.ifc');
    viewer.context.getDimensions()
    const allIDs = getAllIds(ifcModel);
    ids = allIDs;
    const subset = getWholeSubset(viewer, ifcModel, allIDs);
    replaceOriginalModelBySubset(viewer, ifcModel, subset);
    setupEvents(viewer)
  }

  const setupEvents = (viewer, onSectionBoxMode) => {
    if (onSectionBoxMode) {
      if (sectionBoxMode === true) {
        viewer.IFC.selector.unpickIfcItems()
        window.ondblclick = () => hideClickedItem(viewer);
      } else {
        showAllItems(viewer, ids)
        window.ondblclick = () => viewer.IFC.selector.pickIfcItem(true);
      }
    } else {
      if (sectionBoxMode === true) {
        window.ondblclick = () => hideClickedItem(viewer);
      } else {
        window.ondblclick = () => viewer.IFC.selector.pickIfcItem(true);
      }
    }
  }

  const getAllIds = (ifcModel) => {
    return Array.from(
      new Set(ifcModel.geometry.attributes.expressID.array),
    );
  }

  const replaceOriginalModelBySubset = (viewer, ifcModel, subset) => {
    const items = viewer.context.items;
    items.pickableIfcModels = items.pickableIfcModels.filter(model => model !== ifcModel);
    items.ifcModels = items.ifcModels.filter(model => model !== ifcModel);
    ifcModel.removeFromParent();
    items.ifcModels.push(subset);
    items.pickableIfcModels.push(subset);
  }

  const getWholeSubset = (viewer, ifcModel, allIDs) => {
    return viewer.IFC.loader.ifcManager.createSubset({
      modelID: ifcModel.modelID,
      ids: allIDs,
      applyBVH: true,
      scene: ifcModel.parent,
      removePrevious: true,
      customID: 'full-model-subset',
    });
  }

  const showAllItems = (viewer, ids) => {
    viewer.IFC.loader.ifcManager.createSubset({
      modelID: 0,
      ids,
      removePrevious: false,
      applyBVH: true,
      customID: 'full-model-subset',
    });
  }

  const hideClickedItem = (viewer) => {
    const result = viewer.context.castRayIfc();
    if (!result) return;
    const manager = viewer.IFC.loader.ifcManager;
    const id = manager.getExpressId(result.object.geometry, result.faceIndex);
    const filteredIds = ids.filter((el) => {
      return el !== id
    })
    filteredIds.forEach((el) => {
      return viewer.IFC.loader.ifcManager.removeFromSubset(
        0,
        [el],
        'full-model-subset',
      );
    })
  }

  const uploadFile = async (event) => {
    const file = event.target.files[0]
    console.log(file)
    await viewer.IFC.setWasmPath("../../");
    let model = await viewer.IFC.loadIfc(file);
    ifcModel = model;
    main()
    // window.viewer.shadowDropper.renderShadow(model.modelID);
  }

  const enableSectionBoxMode = () => {
    if (sectionBoxMode === false) {
      alert("section box mode has been enabled double click an item to control it")
    } else {
      alert("section box mode has been disabled")
    }
    sectionBoxMode = !window.sectionBoxMode;
    setupEvents(viewer, true)
  }

  window.onkeydown = (event) => {
    if (event.code === "KeyC") {
      viewer.clipper.createPlane()
    } else if (event.code === "KeyX") {
      if (viewer.clipper.active) {
        viewer.clipper.deletePlane()
      }
    } else if (event.code === "KeyH") {
      showAllItems(viewer, ids)
    }
  };

  const openNav = () => {
    document.getElementById("mySidenav").style.width = "250px";
  }

  const closeNav = () => {
    document.getElementById("mySidenav").style.width = "0";
  }

  return (
    <div className="App">
      <span style={{ fontSize: "30px", cursor: "pointer", position: "absolute", zIndex: "1", left: "10px" }}
        onClick={openNav}>&#9776;</span>
      <div id="mySidenav" className="sidenav">
        <a className="closebtn" onClick={closeNav}>&times;</a>
        <a>
          <label htmlFor="file">
            <img src={folder} />
            Open File
          </label>
          <input type="file" id="file" accept=".ifc" onChange={(e) => uploadFile(e)} name="file"
            className="inputfile" />
          <div onClick={enableSectionBoxMode}><img src={packageIcon} />Item section box</div>
        </a>
      </div>
      <div id="tips-container">
        <div>Press "C" to open clipper</div>
        <div>Press "X" to close clipper</div>
        <div>Press "H" to unhide objects</div>
      </div>
      <div id="viewer-container"></div>
    </div>
  );
}

export default App;
