//http://datatables.net/plug-ins/api
$.fn.dataTableExt.oApi.fnGetColumnIndex = function ( oSettings, sCol ) 
{
    var cols = oSettings.aoColumns;
    for ( var x=0, xLen=cols.length ; x<xLen ; x++ )
    {
        if ( cols[x].sTitle.toLowerCase() == sCol.toLowerCase() )
        {
            return x;
        };
    }
    return -1;
};


$.fn.dataTableExt.oApi.fnColumnFilter = function( oSettings, oData ) {
  for ( var i = 0, iLen = oSettings.aoColumns.length; i < iLen; i++ ) {
    var key = oSettings.aoColumns[i].sName;
    if (oData.hasOwnProperty(key)) {
      /* Add single column filter */
      oSettings.aoPreSearchCols[i].sSearch = oData[key];
    }
    else {
      oSettings.aoPreSearchCols[i].sSearch = '';
    }
  } 
  this.oApi._fnDraw(oSettings);
};