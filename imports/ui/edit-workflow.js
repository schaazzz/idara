import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import './edit-workflow.html';

var jsonEditor = null;
var overallArcIndex = 1;

defaultWorkflow =
    `{\"default\": [{
            \"stateName\": \"Open\",
            \"nextState\": \"$fixed:Review\"
        }, {
            \"stateName\":\"Review\",
            \"hasParticipants\": true,
            \"participantsRole\": \"Reviewer\",
            \"nextState\": \"$select:Resolution,Closed\",
            \"openComments\": true
        }, {
            \"stateName\":\"Resolution\",
            \"hasParticipants\": false,
            \"participantsRole\": null,
            \"nextState\": \"$fixed:Test\",
            \"openComments\": false
        }, {
            \"stateName\":\"Test\",
            \"hasParticipants\": true,
            \"participantsRole\": \"Tester\",
            \"nextState\": \"$select:Review,Closed\",
            \"openComments\": false
        }, {
            \"stateName\": \"Closed\",
            \"nextState\": \"$none\"
        }]
    }`;

Template.editWorkflow.onCreated(function onCreated() {
});

Template.editWorkflow.onRendered(function onRendered() {
    jsonEditor = CodeMirror.fromTextArea(
        document.getElementById('txt-workflow'),
        {indentUnit: 4, tabSize: 4, indentWithTabs: false, cursorHeight: 0.85});

    $(".CodeMirror").css('font-size','10pt');
    $(".CodeMirror").css('border', '2px solid #1abc9c');
    $(".CodeMirror").css('border-radius', '5px');
    jsonEditor.setValue(defaultWorkflow);
    jsonEditor.setSize('100%', '88%');
});

Template.editWorkflow.events({
    'click [id=btn-parse-workflow]'(event, template) {
        $('#modal-workflow').modal();

        var parsedWorkflow = JSON.parse(defaultWorkflow);
        var workflowCanvas = document.getElementById('canvas-workflow');
        workflowCanvas.height = parsedWorkflow.default.length * 100;
        var workflowCanvasCtx = workflowCanvas.getContext('2d');

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

            for (i = 0; i < parsedWorkflow.default.length; i++) {
                if ((e.offsetX > parsedWorkflow.default[i].rectX)
                    && (e.offsetX < (parsedWorkflow.default[i].rectX + parsedWorkflow.default[i].rectWidth))
                    && (e.offsetY > parsedWorkflow.default[i].rectY)
                    && (e.offsetY < (parsedWorkflow.default[i].rectY + parsedWorkflow.default[i].rectHeight))) {
                        stateClicked = true;
                        break;
                    }
            }

            if (stateClicked && (parsedWorkflow.default[i].stateName != 'Open') && (parsedWorkflow.default[i].stateName != 'Closed')) {
                var txtArray = [];
                var maxWidth = 0;

                txtArray.push('hasParticipants: '+ parsedWorkflow.default[i].hasParticipants);
                txtArray.push('participantsRole: '+ parsedWorkflow.default[i].participantsRole);
                txtArray.push('nextState: '+ parsedWorkflow.default[i].nextState);
                txtArray.push('openComments: '+ parsedWorkflow.default[i].openComments);

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
            for (i = 0; i < parsedWorkflow.default.length; i++) {
                if (parsedWorkflow.default[i].stateName == stateName) {
                    break;
                }
            }
            return i;
        }

        function connectStates(index) {
            function indirectConnection(i, j) {
                if (parsedWorkflow.default[i].numIndirectConnections) {
                    parsedWorkflow.default[i].numIndirectConnections++
                } else {
                    parsedWorkflow.default[i].numIndirectConnections = 1;
                }

                if (parsedWorkflow.default[j].numIndirectConnections) {
                    parsedWorkflow.default[j].numIndirectConnections++
                } else {
                    parsedWorkflow.default[j].numIndirectConnections = 1;
                }

                var xN = parsedWorkflow.default[i].rectX + parsedWorkflow.default[i].rectWidth;
                var yN = parsedWorkflow.default[i].rectY + ((parsedWorkflow.default[i].rectHeight) / (1 + parsedWorkflow.default[i].numIndirectConnections));

                workflowCanvasCtx.moveTo(xN, yN);
                workflowCanvasCtx.lineTo(xN + (25 * overallArcIndex), yN);

                workflowCanvasCtx.moveTo(xN + (25 * overallArcIndex), yN);
                yN = parsedWorkflow.default[j].rectY + ((parsedWorkflow.default[j].rectHeight) / (1 + parsedWorkflow.default[j].numIndirectConnections));
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
                var x0 = parsedWorkflow.default[index].rectX + (parsedWorkflow.default[index].rectWidth / 2);
                var y0 = parsedWorkflow.default[index].rectY + parsedWorkflow.default[index].rectHeight;
                var y1 = parsedWorkflow.default[index + 1].rectY;

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

            if (parsedWorkflow.default[index].singleNextState) {
                if(parsedWorkflow.default[index].singleNextState == (index + 1)) {
                    directConnection(index);
                } else {
                    indirectConnection(index, parsedWorkflow.default[index].singleNextState);
                }
            }

            if (parsedWorkflow.default[index].multipleNextStates) {
                var statesArray = parsedWorkflow.default[index].multipleNextStates;
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
            workflowCanvasCtx.strokeStyle = 'rgb(50, 50, 0)';
            workflowCanvasCtx.fillStyle = 'rgb(255, 0, 0)';

            for (var i = 0; i < parsedWorkflow.default.length; i++) {
                roundedRect(workflowCanvasCtx, 100, 20 + (i * 90), 150, 65, 10, false, true);
                workflowCanvasCtx.font = '20px Georgia';
                workflowCanvasCtx.fillText(parsedWorkflow.default[i].stateName, 130, 20 + (i * 90) + 25);
                workflowCanvasCtx.lineWidth = 2;
                parsedWorkflow.default[i].rectX = 100;
                parsedWorkflow.default[i].rectY = 20 + (i * 90);
                parsedWorkflow.default[i].rectWidth = 150;
                parsedWorkflow.default[i].rectHeight = 65;

                if (parsedWorkflow.default[i].numIndirectConnections) {
                    parsedWorkflow.default[i].numIndirectConnections = 0;
                }

                var nextState = parsedWorkflow.default[i].nextState;
                var transition = nextState.split(':')[0];
                nextState = nextState.split(':')[1];

                if (transition == '$fixed') {
                    parsedWorkflow.default[i].singleNextState = getStateIndex(nextState);
                }

                if (transition == '$select') {
                    parsedWorkflow.default[i].multipleNextStates = [];
                    nextState = nextState.replace(' ', '').split(',');
                    for (var j = 0; j < nextState.length; j++) {
                        parsedWorkflow.default[i].multipleNextStates.push(getStateIndex(nextState[j]));
                    }

                    parsedWorkflow.default[i].multipleNextStates.sort();
                }
            }

            for (var i = 0; i < parsedWorkflow.default.length; i++) {
                connectStates(i);
            }
        }

        redraw();
    }
});
