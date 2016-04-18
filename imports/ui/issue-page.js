import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects.js';
import {Issues} from '../api/issues.js';
import {Comments} from '../api/comments.js';
import './issue-page.html';

var selectedTab = new ReactiveVar(null);
var nextState = new ReactiveVar(null);
var currentState = new ReactiveVar(null);
var unblockStateTransition = new ReactiveVar(false);

Template.issuePage.onCreated(function onCreated () {
});

Template.issuePage.onRendered(function onRendered() {
    var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
    var thisProject = Projects.findOne({'name': activeProject.get()});
    var workflow = thisProject.workflow;

    this.$('#chk-state-complete').radiocheck();

    if ((workflow[thisIssue.stateIndex].state != 'Open') &&
        (workflow[thisIssue.stateIndex].state != 'Closed')) {
        this.$('#div-state-complete').removeClass('hidden');
    } else {
        this.$('#div-state-complete').addClass('hidden');
    }

    this.autorun(function() {
        state = currentState.get();
        console.log($('#tab-' + state.state));
        $('#tab-' + state.state).tab('show');
    });
});

Template.issuePage.helpers({
    allStates() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = [];

        if (thisIssue.stateIndex > 0) {
            workflow = thisProject.workflow;
            workflow = workflow.slice(1, thisIssue.stateIndex + 1);
            workflow[0].isFirst = true;
        }

        return workflow;
    },
    isNextStateClosed() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = thisProject.workflow;

        return workflow[thisIssue.stateIndex + 1].state == 'Closed';
    },
    isClosed() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = thisProject.workflow;

        return workflow[thisIssue.stateIndex].state == 'Closed';
    },
    currentState() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = thisProject.workflow;

        if ((workflow[thisIssue.stateIndex].state != 'Open') &&
            (workflow[thisIssue.stateIndex].state != 'Closed')) {
            $('#div-state-complete').removeClass('hidden');
        } else {
            $('#div-state-complete').addClass('hidden');
        }

        state = workflow[thisIssue.stateIndex];
        currentState.set(state)

        return state;
    },
    nextState() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = thisProject.workflow;

        state = workflow[thisIssue.stateIndex + 1];
        nextState.set(state)

        return state;
    },
    issue() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisIssue.startDate = moment(new Date()).format('YYYY-MM-DD');
        return thisIssue;
    },
    comments() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        return Comments.find({'project': activeProject.get(), 'issue': parseInt(activeIssue.get()), 'state': thisIssue.stateIndex});
    },
    blockStateTransition() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = thisProject.workflow;

        var result = false;
        if ((workflow[thisIssue.stateIndex].state != 'Open') &&
            (workflow[thisIssue.stateIndex].state != 'Closed') &&
            !unblockStateTransition.get()) {
            result = true;
        }

        return result;
    },
    users() {
        return Meteor.users.find({});
    },
    haveAllParticipantsCommented() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});

        var result = false;
        for (var i = 0; i < thisIssue.participants[thisIssue.stateIndex].length; i++) {
            usr = thisIssue.participants[thisIssue.stateIndex][i];
            comment = Comments.findOne({'project': activeProject.get(), 'issue': parseInt(activeIssue.get()), state: thisIssue.stateIndex, createdBy: usr});

            if (comment) {
                result = true;
            } else {
                result = false;
                break;
            }
        }

        return result;
    }
});

Template.issuePage.events({
    'click [id=btn-add-comment]'(event, template) {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        Meteor.call('comments.insert', activeProject.get(), parseInt(activeIssue.get()), thisIssue.stateIndex, $('#txt-comment').val());
        $('#txt-comment').val('');
        $('#div-comment').removeClass('in');
    },
    'click [id=btn-next-state]'(event, template) {
        Meteor.call('issues.incrementState', activeProject.get(), parseInt(activeIssue.get()));
    },
    'click [name=comments-tab]'(event, template) {
        $('.tab-pane.in').removeClass('in');
        $('.tab-pane.active').removeClass('active');

        activePaneId = event.target.id.split('-')[1];

        $('#' + activePaneId).addClass('active');
        $('#' + activePaneId).addClass('in');
    },
    'click [id=btn-add-participant]'(event, template) {
        if ($('#select-responsible').val() != -1) {
            var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
            var thisProject = Projects.findOne({'name': activeProject.get()});

            var participant = $('#select-responsible :selected').text()
            Meteor.call('issues.addParticipant', activeProject.get(), parseInt(activeIssue.get()), thisIssue.stateIndex, participant, function (error, result) {
                if(result) {
                    var historyTxt = '[' + moment(new Date()).format('YYYY-MM-DD, HH:MM') + '] ' + Meteor.user().username + ' added ' + participant + ' as a ' + thisProject.workflow[thisIssue.stateIndex].participantsRole;
                    Meteor.call('issues.addHistory', activeProject.get(), parseInt(activeIssue.get()), historyTxt);
                }
            });
        }
    },
    'change [id=chk-state-complete]'(event, template) {
        if (event.target.checked) {
            unblockStateTransition.set(true);
        }
    },
});
