import React, { useEffect, useState, useContext, forwardRef, useRef } from 'react';
import Navbar from './Navbar';
import { TableContext, UserProfile, SystemTypeContext } from '../misc/contexts.js';

import setStateFromGetAPI, {getAllCellDataFromAPI} from '../misc/api.js';
import LawsCanvas from './LawsCanvas';
import { showMessage } from '../misc/message';
import { isResponseSuccessful } from '../misc/api';
import { convertToMLTI } from '../misc/converters';
import { convertMarkdownToEditorState } from '../misc/converters';

const API_BASE = () => process.env.REACT_APP_API_LINK;

const rowCount = 21
const cellCount = 20

export default function TableUI({modalsVisibility, gkState, selectedCellState, revStates, selectedLawState,hoveredCellState,refTable,lawsGroupsState ,lawsState,lawEditorsStates,showModeState}) {

  const [once, setOnce] = useState(true);
  const tableState = useContext(TableContext)

  useEffect(() => {

  if (document.getElementById("cell-204") !== null && once) {
    document.getElementById("cell-204").scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    setOnce(false)
  }

  }, [tableState,once]);




  return (
    <>
      <Navbar revStates={revStates} modalsVisibility={modalsVisibility} selectedCell={selectedCellState.selectedCell}/>
      <CellOptions selectedCellState={selectedCellState} gkColors={gkState.gkColors} revStates={revStates} modalsVisibility={modalsVisibility}/>
      <Table
      gkColors={gkState.gkColors}
      selectedCellState={selectedCellState}
      hoveredCellState={hoveredCellState}
      selectedLawState={selectedLawState}
      ref={refTable}
      modalsVisibility={modalsVisibility}
      lawsGroupsState={lawsGroupsState}
      lawsState={lawsState}
      lawEditorsStates={lawEditorsStates}
      showModeState={showModeState}
      />
      <LawOptions lawsState={lawsState} lawsGroupsState={lawsGroupsState} selectedLawState={selectedLawState} lawEditorsStates={lawEditorsStates} modalsVisibility={modalsVisibility}/>
    </>
    );
}

function CellOptions({selectedCellState ,gkColors, revStates,modalsVisibility}) {

  const selectedCell = selectedCellState.selectedCell
  const setSelectedCell = selectedCellState.setSelectedCell
  const systemTypeState = useContext(SystemTypeContext);

  const [cellAlternatives, setCellAlternatives] = useState(null);

  useEffect(() => {
    if (selectedCell && !modalsVisibility.editCellModalVisibility.isVisible) {
      setStateFromGetAPI(setCellAlternatives, `${API_BASE()}/quantities/by-system-type/${systemTypeState.currentSystemTypeId}/by-lt/${selectedCell.lt_id}`);
    } else { setCellAlternatives(null); }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCell, systemTypeState.currentSystemTypeId]);

  if (cellAlternatives !== null && selectedCell) {

    const emptyCellData = { lt_id: selectedCell.lt_id, id: -1, unit: "", l_indicate: selectedCell.l_indicate, t_indicate: selectedCell.t_indicate };
    const emptyCellShowData = { lt_id: selectedCell.lt_id, id: -1, unit: "", name: "«Скрыть»" };

    let cells = cellAlternatives.filter(cellData => cellData.id !== selectedCell.id).map(cellData => {

      const cellFullId = cellData.id;
      const cellGKLayer = gkColors.find((setting) => setting.id === cellData.gk_id);
      const cellColor = cellGKLayer ? cellGKLayer.color : "#CCCCCC";


      return (
        <Cell
        key={cellFullId}
        cellFullData={{cellFullId,cellData,cellColor}}
        selectedCells={cellAlternatives.concat(emptyCellData)}
        revStates={revStates}
        setSelectedCell={setSelectedCell}
        />
      )


    })


    if (selectedCell.gk_id) {
      cells.push(
        <Cell
        key={-1}
        cellFullData={{cellFullId:-1,cellData:emptyCellShowData,cellColor:"#CCCCCC"}}
        selectedCells={cellAlternatives.concat(emptyCellData)}
        revStates={revStates}
        setSelectedCell={setSelectedCell}
        className="fancy-empty-cell"
        />
      )
    }

    const cellOptions = cells.length !== 0 ? cells : "Нет альтернативных ячеек"



    return (
      <div className="data-window">
        <div className="data-window-top">
        <span>Другие уровни</span>
        <button type="button" className="btn-close" onClick={() => setSelectedCell(null)}></button>
        </div>
        {cellOptions}
      </div>
    );




  } else {
    return null
  }


}

function LawOptions({lawsState,lawsGroupsState,selectedLawState,lawEditorsStates,modalsVisibility}) {

  const tableState = useContext(TableContext)
  const userInfoState = useContext(UserProfile)
  const headers = {
    Authorization: `Bearer ${userInfoState.userToken}`
  }

  const selectLaw = async (selectedLaw) => {

    // get all cell Id's into an array
    const lawCellsIds = [selectedLaw.first_quantity_id, selectedLaw.second_quantity_id, selectedLaw.third_quantity_id, selectedLaw.fourth_quantity_id];

    const lawCellsResponse = await getAllCellDataFromAPI(lawCellsIds, headers);
    if (!isResponseSuccessful(lawCellsResponse[0])) {
      showMessage(lawCellsResponse[0].data?.detail || lawCellsResponse[0].data?.error, "error");
      return;
    }
    const lawCells = lawCellsResponse.map(cellResponse => cellResponse.data);

    selectedLawState.setSelectedLaw({ name: selectedLaw.name, cells: lawCells, law_group_id: selectedLaw.law_group_id, id: selectedLaw.id });

    // update cells to reflect new law
    let newTable = tableState.tableData
    lawCells.forEach(cellData => {
      newTable = newTable.filter(cell => cell.lt_id !== cellData.lt_id).concat(cellData);
    });
    tableState.setTableData(newTable)

    // show message
    showMessage("Закон выбран")

  }

  const editLaw = async (selectedLaw) => {

    convertMarkdownToEditorState(lawEditorsStates.lawNameEditorState.set, selectedLaw.name);

    lawEditorsStates.lawGroupEditorState.set(selectedLaw.law_group_id);

    selectLaw(selectedLaw)

    modalsVisibility.lawsModalVisibility.setVisibility(true)

  }

  const lawsGroups = lawsGroupsState.lawsGroups

  if (!lawsState.laws || !lawsGroups) {
    return null
  }

  const lawOptions = [...lawsGroups, { name: "Без группы", id: null }].map((lawGroup) => {

  const lawsInThisGroup = lawsState.laws.filter(law => law.law_group_id === lawGroup.id);


    if (lawsInThisGroup.length === 0) {
      return (
        <details key={lawGroup.id}>
        <summary>{lawGroup.name}</summary>
        Законов нет
        </details>
      )
    }

    const lawsInThisGroupMarkup = lawsInThisGroup.map(law => {

      const isCurrent = selectedLawState.selectedLaw.id === law.id;

      return (
        <tr key={law.id}>
          <th scope="row" className='small-cell'>{isCurrent ? `+` : ''}</th>
          <td onClick={() => { selectLaw(law); }} className="hover-table-cell" dangerouslySetInnerHTML={{ __html: law.name }} />
          <td className='small-cell'><button type="button" className="btn btn-primary btn-sm" onClick={() => editLaw(law)}>📝</button></td>
        </tr>
      )
    })



    return (

      <details key={lawGroup.id}>
        <summary>{lawGroup.name}</summary>
          <table className="table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Название</th>
              <th scope="col">ⓘ</th>
            </tr>
          </thead>
          <tbody>
            {lawsInThisGroupMarkup}
          </tbody>
        </table>
      </details>

    )

  })

  if (modalsVisibility.LawsMenuVisibility.isVisible) {

    return (

      <div className="data-window data-window-left">
        <div className="data-window-top">
        <span>Выбор закона</span>
        <button type="button" className="btn-close" onClick={() => {modalsVisibility.LawsMenuVisibility.setVisibility(false)}}></button>
        </div>
        {lawOptions}
      </div>

    )
  } else {return null}



}

const Table = forwardRef(({ gkColors, selectedCellState, hoveredCellState, selectedLawState,modalsVisibility,lawsGroupsState,lawsState,lawEditorsStates,showModeState}, ref) => {


  const tableState = useContext(TableContext)
  const tableData = tableState.tableData
  const fullTableData = { tableData: tableData, Colors: gkColors};

  const [emptyCells, setEmptyCells] = useState([]);

  const isLoaded = tableData.length !== 0 && gkColors.length !== 0 && emptyCells.length !== 0

  useEffect(() => {

    setStateFromGetAPI(setEmptyCells, `${API_BASE()}/lt`)

  }, []);

  let zoom = useRef(undefined)
  let scale = useRef(1)
  let panning = useRef(false)
  let pointX = useRef(1109)
  let pointY = useRef(973)
  let start = useRef({ x: 0, y: 0 })

  if (document.getElementById("table") && zoom.current === undefined) {
    zoom.current = document.getElementById("table")
  }

  useEffect(() => {

    if (zoom.current) {

    function setTransform() {
      document.getElementById("table-scale").style.transform = "scale(" + scale.current + ")";
      zoom.current.scrollTop = 1947 - pointY.current;
      zoom.current.scrollLeft = 1841 - pointX.current;

    }

    zoom.current.onscroll =  function (e) {

      pointY.current = 1947 - zoom.current.scrollTop
      pointX.current = 1841 - zoom.current.scrollLeft
      pointY.current = pointY.current>1947 ? 1947 : pointY.current
      pointX.current = pointX.current>1841 ? 1841 : pointX.current
    }

    zoom.current.onmousedown = function (e) {
      e.preventDefault();
      start.current = { x: e.clientX - pointX.current, y: e.clientY - pointY.current };
      panning.current = true;
    }

    zoom.current.onmouseup = function (e) {
      panning.current = false;
    }

    zoom.current.onmousemove = function (e) {
      e.preventDefault();
      if (!panning.current) {
        return;
      }
      pointX.current = (e.clientX - start.current.x);
      pointY.current = (e.clientY - start.current.y);
      setTransform();
    }

    // zoom.current.onwheel = function (e) {
    //   e.preventDefault();
    //   var xs = (e.clientX - pointX.current) / scale.current,
    //     ys = (e.clientY - pointY.current) / scale.current,
    //     delta = (e.wheelDelta ? e.wheelDelta : -e.deltaY);
    //   (delta > 0) ? (scale.current *= 1.2) : (scale.current /= 1.2);
    //   if (scale.current > 1.2**3) {return}
    //   if (scale.current < 1.2**-3) {return}
    //   pointX.current += 500;
    //   //pointY.current = e.clientY - (ys) * scale.current;

    //   setTransform();
    // }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom.current]);



  let selectedLawCellsLTId = selectedLawState.selectedLaw.cells.map(cell => cell.lt_id);

  if (hoveredCellState.hoveredCell !== null && selectedLawCellsLTId.length >= 1 && selectedLawCellsLTId.length < 3) {
    selectedLawCellsLTId.push(hoveredCellState.hoveredCell.lt_id);
  }


  if (hoveredCellState.hoveredCell !== null && selectedLawCellsLTId.length === 3) {
    selectedLawCellsLTId.push(findFourthCell(selectedLawCellsLTId));
  }

  const selectedLawGroup = lawsGroupsState.lawsGroups.find(group => group.id === selectedLawState.selectedLaw.law_group_id);

  let color = "#000000"
  if (selectedLawGroup) {
    color = selectedLawGroup.color
  }



  if (isLoaded) {
    const rowList = Array.from({length: rowCount}, (_, rowId) => {
      return <Row
      key={rowId}
      rowId={rowId}
      fullTableData={fullTableData}
      selectedCellState={selectedCellState}
      hoveredCellState={hoveredCellState}
      selectedLawState={selectedLawState}
      modalsVisibility={modalsVisibility}
      emptyCellsData={emptyCells}
      lawsState={lawsState}
      lawEditorsStates={lawEditorsStates}
      showModeState={showModeState}
      />
    });
      return (
        <div className="tables" id='table' ref={ref}>
          <div id='table-scale'>
            {rowList}
            <LawsCanvas lawCells={ selectedLawCellsLTId} color={color}/>
          </div>
        </div>
      )
  }
  else
  {
     return (
      <div className="loading">
          <img src="/bee2.gif" alt="Loading"/>
      </div>
     )
  }

})

function Row({rowId, fullTableData, selectedCellState, hoveredCellState, selectedLawState, modalsVisibility, emptyCellsData,lawsState,lawEditorsStates,showModeState}) {

  const isEven = (rowId % 2 === 0 ? 0 : 1)
  const setSelectedCell = selectedCellState.setSelectedCell



    const cellList = Array.from({ length: cellCount - isEven }, (_, cellId) => {

    const cellFullId = rowId * 19 + isEven + cellId + 1 + Math.floor(rowId / 2);
    let cellData = fullTableData.tableData.find(cell => cell.lt_id === cellFullId);
    const emptyCell = emptyCellsData.find(cell => cell.id === cellFullId);
    let cellIndicates = { t_indicate: emptyCell?.t_indicate, l_indicate: emptyCell?.l_indicate };
    let hoverData = emptyCell;
    let cellColor;
    let borderColor;
    if (cellData) {
      cellData = { ...cellData, ...cellIndicates };
      if (cellData.gk_id) {
        const cellGKLayer = fullTableData.Colors.find((setting) => setting.id === cellData.gk_id);
        const cellNormalColor = cellGKLayer ? cellGKLayer.color : "#CCCCCC";
        cellColor = cellNormalColor;

        hoverData.GKLayer = cellGKLayer;

        if (selectedCellState.selectedCell) {
          borderColor = cellData.id === selectedCellState.selectedCell.id ? "orange" : "";
        }
        if (selectedLawState.selectedLaw) {
          borderColor = selectedLawState.selectedLaw.cells.find(lawCell => lawCell.id === cellData.id) ? "red" : borderColor;
        }
      }
    } else {
      cellData = emptyCell ? { ...emptyCell, id: -1, lt_id: emptyCell.id } : { id: -1, lt_id: cellFullId };
    }

    return (<Cell
            key={cellFullId}
            cellFullData={{cellFullId,cellData,cellColor,borderColor}}
            cellRightClick={setSelectedCell}
            hoveredCellState={hoveredCellState}
            hoverData={{hoveredCellState,hoverData}}
            selectedLawState={cellColor ? selectedLawState : undefined}
            modalsVisibility={modalsVisibility}
            isEmpty={cellColor ? false:true}
            lawsState={lawsState}
            lawEditorsStates={lawEditorsStates}
            showModeState={showModeState}
            />);
  });


  if (isEven) {
    return (<div className="row">
      <div className="half-cell"></div>
      {cellList}
      </div>)
  } else {
    return <div className="row">{cellList}</div>
  }

}

let drag = false;
document.addEventListener( 'mousedown', () => drag = false);

document.addEventListener( 'mousemove', () => drag = true);

export function Cell({cellFullData, cellRightClick, selectedCells, revStates, setSelectedCell, selectedLawState, modalsVisibility,hoverData,isEmpty = false, className = "",lawsState,lawEditorsStates,showModeState}) {

  const cellFullId = cellFullData.cellFullId
  const cellData = cellFullData.cellData
  const cellColor = cellFullData.cellColor
  const borderColor = cellFullData.borderColor
  const tableState = useContext(TableContext)
  const userInfoState = useContext(UserProfile)
  const headers = {
    Authorization: `Bearer ${userInfoState.userToken}`
  }

  const handleCellRightClick = (event) => {

    event.preventDefault()



    cellRightClick(cellData)

  };

  const handleCellLeftClick = (event, cellId) => {


      event.preventDefault()


      const cellData = selectedCells.find(cell => cell.id === cellId);

      tableState.setTableData(tableState.tableData.filter(cell => cell.lt_id !== cellData.lt_id).concat(cellData));

      revStates.setUndoStack([...revStates.undoStack, tableState.tableData]);
      revStates.setRedoStack([]);

      setSelectedCell(null)


  };

  const handleLawSelection = async (event, cellId) => {

      const selectedCellData = tableState.tableData.find(cell => cell.lt_id === cellId);

      if (selectedLawState.selectedLaw.cells.map(cell => cell.lt_id).find(lid => lid === selectedCellData.lt_id) === undefined && selectedLawState.selectedLaw.cells.length < 2) {
        selectedLawState.setSelectedLaw(
        {
          name: null,
          cells: [...selectedLawState.selectedLaw.cells, selectedCellData],
          law_group_id: null,
        }
        );
      }

      if (selectedLawState.selectedLaw.cells.map(cell => cell.lt_id).find(lid => lid === selectedCellData.lt_id) === undefined && selectedLawState.selectedLaw.cells.length === 2) {
        const selectedLawCellsLTId = selectedLawState.selectedLaw.cells.map(cell => cell.lt_id);
        selectedLawCellsLTId.push(selectedCellData.lt_id);
        const fourthCellData = tableState.tableData.find(cell => cell.lt_id === findFourthCell(selectedLawCellsLTId))

        if (!fourthCellData) {
          selectedLawState.setSelectedLaw({ name: null, cells: [], law_group_id: null });
          showMessage("Выбрана пустая ячейка", "error");
          return
        }

        if (lawsState.laws) {
          const dublicateLaw = lawsState.laws.find(law => {
            const lawInArray = [law.first_quantity_id, law.second_quantity_id, law.third_quantity_id, law.fourth_quantity_id];
            const currentLaw = [...selectedLawState.selectedLaw.cells, selectedCellData, fourthCellData].map(cell => cell.id);
            return arraysEqual(lawInArray, currentLaw);
          });

          if (dublicateLaw) {
            const lawCellsIds = [dublicateLaw.first_quantity_id, dublicateLaw.second_quantity_id, dublicateLaw.third_quantity_id, dublicateLaw.fourth_quantity_id];
            const lawCellsFullData = lawCellsIds.map(cellId => tableState.tableData.find(tableCell => tableCell.id === cellId));

            modalsVisibility.lawsModalVisibility.setVisibility(true);
            selectedLawState.setSelectedLaw({
              ...dublicateLaw,
              cells: lawCellsFullData,
            });
            convertMarkdownToEditorState(lawEditorsStates.lawNameEditorState.set, dublicateLaw.name);
            lawEditorsStates.lawGroupEditorState.set(dublicateLaw.law_group_id);

            showMessage("Этот закон уже существует", "warn");
            return
          }
        }

        selectedLawState.setSelectedLaw(
          {
            name: null,
            cells: [...selectedLawState.selectedLaw.cells, selectedCellData, fourthCellData],
            law_group_id: null,
          }
        );

        const lawCellsResponse = await getAllCellDataFromAPI([...selectedLawState.selectedLaw.cells, selectedCellData, fourthCellData].map(cell => cell.id), headers);
        if (!isResponseSuccessful(lawCellsResponse[0])) {
          showMessage(lawCellsResponse[0].data?.detail || lawCellsResponse[0].data?.error, "error");
          return
        }
        const lawCells = lawCellsResponse.map(cellResponse => cellResponse.data);

        const isCorrectLaw = checkLaw(lawCells)

        if (!isCorrectLaw) {
          selectedLawState.setSelectedLaw({ name: null, cells: [], law_group_id: null });
          showMessage("Данного закона не существует","error")
          return
        }

        convertMarkdownToEditorState(lawEditorsStates.lawNameEditorState.set, "")
        lawEditorsStates.lawGroupEditorState.set(-1)

        showMessage("Закон выбран")

        if (lawsState.laws && userInfoState.userToken) {
        modalsVisibility.lawsModalVisibility.setVisibility(true)
        }
      }

  }

  const handleCellHover = (event, cellData) => {
    hoverData.hoveredCellState.setHoveredCell(cellData)
  }


  const onClickEvent = (event) => {

    if (drag) {
      return
    }
    // showModeState

    //console.log(selectedLawState && showModeState)
    if (showModeState) {
      if (selectedLawState && !showModeState.showMode) {handleLawSelection(event, cellFullId)};

      if (showModeState.showMode) {
                cellRightClick(cellData)
        modalsVisibility.editCellModalVisibility.setVisibility(true)

      }
    }
    if (selectedCells) {handleCellLeftClick(event, cellFullId)};
  }

  if (!isEmpty) {

    const cellContent_name = cellData.name;
    const cellContent_symbol = cellData.symbol;
    const cellContent_unit = cellData.unit;
    const m = cellData.m_indicate_auto;
    const l = cellData.l_indicate_auto;
    const t = cellData.t_indicate_auto;
    const i = cellData.i_indicate_auto;
    const cellContent_mlti = convertToMLTI(m, l, t, i);



    return (
      <div className="cell" style={{ backgroundColor: borderColor }}>
        <div
          className={`inner-cell ${className}`}
          id={`cell-${cellFullId}`}
          style={{ backgroundColor: cellColor }}
          onContextMenu={event => cellRightClick ? handleCellRightClick(event, cellFullId) : {}}
          onClick={onClickEvent}
          onMouseOver={event => hoverData ? handleCellHover(event, hoverData.hoverData) : {}}
          cellnumber={cellFullId}
        >
          <div className='cell-name'>
          <span dangerouslySetInnerHTML={{__html: cellContent_name}}></span>
              <br />
          </div>
          <div className="su-pos" >
          <span dangerouslySetInnerHTML={{__html: cellContent_symbol}}></span>
              {(cellContent_unit === "\n" || cellContent_unit === "") ? '' : ', '}
          <span dangerouslySetInnerHTML={{__html: cellContent_unit}}></span>
              <br />
          </div>
          <div className="mlti-pos">
          <span dangerouslySetInnerHTML={{__html: cellContent_mlti}}></span>
          </div>
        </div>
      </div>
    );
  } else {
    return (
    <div className="cell-invisible cell">
      <div
      className="cell-invisible inner-cell"
      onContextMenu={event => handleCellRightClick(event, cellFullId)}
      onClick={onClickEvent}
      id={`cell-${cellFullId}`}
      cellnumber={cellFullId}
      onMouseOver={event => hoverData ? handleCellHover(event, hoverData.hoverData) : {}}
      />
    </div>
    )
  }

}

function getRow(cellId) {
  return Math.floor(cellId/19.5)+1
}

function getColumn(cellId) {
  return cellId-(Math.floor(getRow(cellId)*19.5))+19
}

function findFourthCell(lawCells) {

  const firstAndSecondCellDifference = {x: getColumn(lawCells[1])-getColumn(lawCells[0]),y: getRow(lawCells[1])- getRow(lawCells[0])}
  const firstCellRow = getRow(lawCells[0])
  const secondCellRow = getRow(lawCells[1])
  const thirdCellRow = getRow(lawCells[2])


  let fourthCellCoords = {x: getColumn(lawCells[2])- firstAndSecondCellDifference.x, y:  getRow(lawCells[2]) - firstAndSecondCellDifference.y}
  if (((firstCellRow % 2) === (thirdCellRow % 2) && (secondCellRow % 2 ) !== (thirdCellRow % 2))) {
    fourthCellCoords = {x: fourthCellCoords.x + ((firstCellRow % 2 === 0) ? 1:-1) ,y: fourthCellCoords.y}
  }

  const cellId = (fourthCellCoords.y-1) * 19 + ((fourthCellCoords.y-1) % 2 === 0 ? 0 : 1) + (fourthCellCoords.x-1) + 1 + Math.floor((fourthCellCoords.y-1) / 2)


  return cellId
}

export function checkLaw(cells) {
  const m0 = Number(cells[0].m_indicate_auto);
  const l0 = Number(cells[0].l_indicate_auto);
  const t0 = Number(cells[0].t_indicate_auto);
  const i0 = Number(cells[0].i_indicate_auto);
  const m1 = Number(cells[1].m_indicate_auto);
  const l1 = Number(cells[1].l_indicate_auto);
  const t1 = Number(cells[1].t_indicate_auto);
  const i1 = Number(cells[1].i_indicate_auto);
  const m2 = Number(cells[2].m_indicate_auto);
  const l2 = Number(cells[2].l_indicate_auto);
  const t2 = Number(cells[2].t_indicate_auto);
  const i2 = Number(cells[2].i_indicate_auto);
  const m3 = Number(cells[3].m_indicate_auto);
  const l3 = Number(cells[3].l_indicate_auto);
  const t3 = Number(cells[3].t_indicate_auto);
  const i3 = Number(cells[3].i_indicate_auto);

  const eps = 1e-3;

  const same =
    Math.abs((m0 + m2) - (m1 + m3)) < eps &&
    Math.abs((l0 + l2) - (l1 + l3)) < eps &&
    Math.abs((t0 + t2) - (t1 + t3)) < eps &&
    Math.abs((i0 + i2) - (i1 + i3)) < eps;

  return same;
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  let aSorted = a.toSorted()
  let bSorted = b.toSorted()

  for (let i = 0; i < aSorted.length; ++i) {
    if (aSorted[i] !== bSorted[i]) return false;
  }
  return true;
}
