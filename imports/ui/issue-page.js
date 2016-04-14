import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects.js';
import {Issues} from '../api/issues.js';
import {Comments} from '../api/comments.js';
import './issue-page.html';

Template.issuePage.onRendered(function onRendered() {
    this.$('#chk-state-complete').radiocheck();
});

Template.issuePage.helpers({
    allStates() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisProject = Projects.findOne({'name': activeProject.get()});

        workflow = [];
        if (thisIssue.stateIndex > 0) {
            workflow = thisProject.workflow;
            workflow = workflow.slice(1, thisIssue.stateIndex + 1);
            workflow[0].isFirst = true;
        }

        return workflow;
    },
    isNextStateClosed() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisProject = Projects.findOne({'name': activeProject.get()});
        workflow = thisProject.workflow;

        return workflow[thisIssue.stateIndex + 1].state == 'Closed';
    },
    isClosed() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisProject = Projects.findOne({'name': activeProject.get()});
        workflow = thisProject.workflow;

        return workflow[thisIssue.stateIndex].state == 'Closed';
    },
    currentState() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisProject = Projects.findOne({'name': activeProject.get()});
        workflow = thisProject.workflow;

        return workflow[thisIssue.stateIndex];
    },
    nextState() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisProject = Projects.findOne({'name': activeProject.get()});
        workflow = thisProject.workflow;

        return workflow[thisIssue.stateIndex + 1];
    },
    issue() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisIssue.startDate = moment(new Date()).format('YYYY-MM-DD');
        return thisIssue;
    },
    comments() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        return Comments.find({'project': activeProject.get(), 'issue': parseInt(activeIssue.get()), 'state': thisIssue.stateIndex});
    },
    blockStateTransition() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisProject = Projects.findOne({'name': activeProject.get()});
        workflow = thisProject.workflow;

        var result = false;
        if ((workflow[thisIssue.stateIndex].state != 'Open') &&
            (workflow[thisIssue.stateIndex].state != 'Closed')) {
            result = true;
        }

        return result;
    },
    users() {
        return Meteor.users.find({});
    }
});

Template.issuePage.events({
    'click [id=btn-add-comment]'(event, template) {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
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
            thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
            thisProject = Projects.findOne({'name': activeProject.get()});

            var participant = $('#select-responsible :selected').text()
            Meteor.call('issues.addParticipant', activeProject.get(), parseInt(activeIssue.get()), thisIssue.stateIndex, participant, function (error, result) {
                if(result) {
                    historyTxt = '[' + moment(new Date()).format('YYYY-MM-DD, HH:MM') + '] ' + Meteor.user().username + ' added ' + participant + ' as a ' + thisProject.workflow[thisIssue.stateIndex].participantsRole;
                    Meteor.call('issues.addHistory', activeProject.get(), parseInt(activeIssue.get()), historyTxt);
                }
            });

        }
    },
    'click [id=chk-state-complete]'(event, template) {
        console.log(event);
    }
});
