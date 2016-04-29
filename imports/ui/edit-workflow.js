import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import { Workflows } from '../api/workflows';
import './edit-workflow.html';

var jsonEditor = null;
var overallArcIndex = 1;
var thisWorkflow = null;
var thisWorkflowSavedId = null;
var workflowName = new ReactiveVar(null);
var newStateTemplate = {
    "name": "<workflow_name>",
    "states": [{
        "stateName": "Open",
        "nextState": "$fixed:<your_next_state_here>"
    }, {
        "stateName": "<insert_new_state_here>"
    }, {
        "stateName": "Closed",
        "nextState": "$none"
    }]
};

function checkWorkflow() {
    var workflow = null;

    try {
        workflow = JSON.parse(jsonEditor.getValue());
    } catch (error) {
        console.log('Invalid JSON!');
    }

    if (workflow.states[0].stateName != 'Open') {
        console.log('First state is not \"Open\"!');
    }

    if (workflow.states[workflow.states.length - 1].stateName != 'Closed') {
        console.log('Last state is not \"Closed\"!');
    }

}

Template.editWorkflow.onCreated(function onCreated() {
    if (newWorkflow.get()) {
        thisWorkflow = newStateTemplate;
    } else {
        thisWorkflow = Workflows.findOne({'name': activeWorkflow.get()}, {'_id': 0});
        thisWorkflowSavedId = thisWorkflow._id;
        workflowName.set(thisWorkflow.name);
        delete thisWorkflow._id;
    }
});

Template.editWorkflow.onRendered(function onRendered() {
    jsonEditor = CodeMirror.fromTextArea(
        document.getElementById('txt-workflow'),
        {indentUnit: 4, tabSize: 4, indentWithTabs: false, cursorHeight: 0.85});

    $(".CodeMirror").css('font-size','10pt');
    $(".CodeMirror").css('border', '2px solid #1abc9c');
    $(".CodeMirror").css('border-radius', '5px');

    if (newWorkflow.get()) {
        jsonEditor.setValue(JSON.stringify(newStateTemplate, null, 4));
    } else {
        jsonEditor.setValue(JSON.stringify(thisWorkflow, null, 4));
    }

    jsonEditor.setSize('100%', '350');
});

Template.editWorkflow.helpers({
    workflowName() {
        return workflowName.get();
    }
});

Template.editWorkflow.events({
    'click [id=btn-save-workflow]'(event, template) {
        checkWorkflow();
        // if (newWorkflow.get()) {
        //     Meteor.call('workflows.insert', thisWorkflow);
        // } else {
        //     Meteor.call('workflows.update', thisWorkflowSavedId, thisWorkflow);
        // }
    },
    'click [id=btn-parse-workflow]'(event, template) {
        thisWorkflow = JSON.parse(jsonEditor.getValue());
        workflowName.set(thisWorkflow.name);

        $('#modal-workflow').modal();

        var workflowCanvas = document.getElementById('canvas-workflow');
        var workflowCanvasCtx = workflowCanvas.getContext('2d');

        workflowCanvas.height = thisWorkflow.states.length * 100;

        function roundedRect(ctx, x, y, width, height, radius, fill, stroke)
        {
            ctx.save();
            ctx.beginPath();

            ctx.moveTo(x + radius, y);
            ctx.arcTo(x + width, y, x + width, y + radius,radius);

            ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);

            ctx.arcTo(x, y + height, x, y + height - radius, radius);

            ctx.arcTo(x, y, x + radius, y, radius);

            if (fill) {
        	    ctx.fill();
            }

            if (stroke) {
        	    ctx.stroke();
            }

            ctx.restore();
        }

        function doMouseDown(e) {
            var i = 0;
            var stateClicked = false;

            for (i = 0; i < thisWorkflow.states.length; i++) {
                if ((e.offsetX > thisWorkflow.states[i].rectX)
                    && (e.offsetX < (thisWorkflow.states[i].rectX + thisWorkflow.states[i].rectWidth))
                    && (e.offsetY > thisWorkflow.states[i].rectY)
                    && (e.offsetY < (thisWorkflow.states[i].rectY + thisWorkflow.states[i].rectHeight))) {
                        stateClicked = true;
                        break;
                    }
            }

            if (stateClicked && (thisWorkflow.states[i].stateName != 'Open') && (thisWorkflow.states[i].stateName != 'Closed')) {
                var txtArray = [];
                var maxWidth = 0;

                txtArray.push('hasParticipants: '+ thisWorkflow.states[i].hasParticipants);
                txtArray.push('participantsRole: '+ thisWorkflow.states[i].participantsRole);
                txtArray.push('nextState: '+ thisWorkflow.states[i].nextState);
                txtArray.push('openComments: '+ thisWorkflow.states[i].openComments);

                workflowCanvasCtx.font = '15px Arial';

                for (var i = 0; i < txtArray.length; i++) {
                    textWidth = workflowCanvasCtx.measureText(txtArray[i]).width;

                    if (textWidth > maxWidth) {
                        maxWidth = textWidth;
                    }
                }
                workflowCanvasCtx.fillStyle = 'rgb(0, 0, 0)';
                roundedRect(workflowCanvasCtx, e.offsetX, e.offsetY, maxWidth + 30, 100, 20, true, true);

                workflowCanvasCtx.fillStyle = 'rgb(255, 255, 255)';
                for (var i = 0; i < txtArray.length;i++) {
                    workflowCanvasCtx.fillText(txtArray[i], e.offsetX + 15, e.offsetY + (25 + (i * 20)));
                }

                workflowCanvasCtx.stroke();
            }
        }

        function doMouseUp(e) {
            workflowCanvasCtx.clearRect(0, 0, workflowCanvas.width, workflowCanvas.height);
            redraw();
        }

        function getStateIndex(stateName) {
            var i = 0;
            for (i = 0; i < thisWorkflow.states.length; i++) {
                if (thisWorkflow.states[i].stateName == stateName) {
                    break;
                }
            }
            return i;
        }

        function connectStates(index) {
            function indirectConnection(i, j) {
                if (thisWorkflow.states[i].numIndirectConnections) {
                    thisWorkflow.states[i].numIndirectConnections++
                } else {
                    thisWorkflow.states[i].numIndirectConnections = 1;
                }

                if (thisWorkflow.states[j].numIndirectConnections) {
                    thisWorkflow.states[j].numIndirectConnections++
                } else {
                    thisWorkflow.states[j].numIndirectConnections = 1;
                }

                var xN = thisWorkflow.states[i].rectX + thisWorkflow.states[i].rectWidth;
                var yN = thisWorkflow.states[i].rectY + ((thisWorkflow.states[i].rectHeight) / (1 + thisWorkflow.states[i].numIndirectConnections));

                workflowCanvasCtx.moveTo(xN, yN);
                workflowCanvasCtx.lineTo(xN + (25 * overallArcIndex), yN);

                workflowCanvasCtx.moveTo(xN + (25 * overallArcIndex), yN);
                yN = thisWorkflow.states[j].rectY + ((thisWorkflow.states[j].rectHeight) / (1 + thisWorkflow.states[j].numIndirectConnections));
                workflowCanvasCtx.lineTo(xN + (25 * overallArcIndex), yN);

                workflowCanvasCtx.moveTo(xN + (25 * overallArcIndex), yN);
                workflowCanvasCtx.lineTo(xN, yN);

                workflowCanvasCtx.moveTo(xN, yN);
                workflowCanvasCtx.lineTo(xN + 10, yN - 5);

                workflowCanvasCtx.moveTo(xN, yN);
                workflowCanvasCtx.lineTo(xN + 10, yN + 5);

                workflowCanvasCtx.stroke();
                overallArcIndex++;
            }

            function directConnection(index) {
                var x0 = thisWorkflow.states[index].rectX + (thisWorkflow.states[index].rectWidth / 2);
                var y0 = thisWorkflow.states[index].rectY + thisWorkflow.states[index].rectHeight;
                var y1 = thisWorkflow.states[index + 1].rectY;

                /* Draw the line between the adjacent nodes */
                workflowCanvasCtx.moveTo(x0, y0);
                workflowCanvasCtx.lineTo(x0, y1);

                /* Draw arrowhead */
                workflowCanvasCtx.moveTo(x0, y1);
                workflowCanvasCtx.lineTo(x0 - 5, y1 - 10);

                workflowCanvasCtx.moveTo(x0, y1);
                workflowCanvasCtx.lineTo(x0 + 5, y1 - 10);

                /* Aaannddd... wait for iiiit... STROKE! */
                workflowCanvasCtx.stroke();
            }

            if (thisWorkflow.states[index].singleNextState) {
                if(thisWorkflow.states[index].singleNextState == (index + 1)) {
                    directConnection(index);
                } else {
                    indirectConnection(index, thisWorkflow.states[index].singleNextState);
                }
            }

            if (thisWorkflow.states[index].multipleNextStates) {
                var statesArray = thisWorkflow.states[index].multipleNextStates;
                for (var i = 0; i < statesArray.length; i++) {
                    if (statesArray[i] == index + 1) {
                        directConnection(index);
                    } else {
                        indirectConnection(index, statesArray[i]);
                    }
                }
            }
        }

        function redraw() {
            overallArcIndex = 1;
            workflowCanvas.addEventListener('mousedown', doMouseDown, false);
            workflowCanvas.addEventListener('mouseup', doMouseUp, false);
            workflowCanvasCtx.strokeStyle = 'rgb(0, 0, 0)';
            workflowCanvasCtx.fillStyle = 'rgb(255, 0, 0)';

            for (var i = 0; i < thisWorkflow.states.length; i++) {
                roundedRect(workflowCanvasCtx, 100, 20 + (i * 90), 250, 65, 10, false, true);
                workflowCanvasCtx.font = '20px Georgia';
                workflowCanvasCtx.fillText(thisWorkflow.states[i].stateName, 130, 20 + (i * 90) + 25);
                workflowCanvasCtx.lineWidth = 2;
                thisWorkflow.states[i].rectX = 100;
                thisWorkflow.states[i].rectY = 20 + (i * 90);
                thisWorkflow.states[i].rectWidth = 250;
                thisWorkflow.states[i].rectHeight = 65;

                if (thisWorkflow.states[i].numIndirectConnections) {
                    thisWorkflow.states[i].numIndirectConnections = 0;
                }

                var nextState = thisWorkflow.states[i].nextState;
                var transition = nextState.split(':')[0];
                nextState = nextState.split(':')[1];

                if (transition == '$fixed') {
                    thisWorkflow.states[i].singleNextState = getStateIndex(nextState);
                }

                if (transition == '$select') {
                    thisWorkflow.states[i].multipleNextStates = [];
                    nextState = nextState.replace(' ', '').split(',');
                    for (var j = 0; j < nextState.length; j++) {
                        thisWorkflow.states[i].multipleNextStates.push(getStateIndex(nextState[j]));
                    }

                    thisWorkflow.states[i].multipleNextStates.sort();
                }
            }

            for (var i = 0; i < thisWorkflow.states.length; i++) {
                connectStates(i);
            }
        }

        redraw();
    }
});
