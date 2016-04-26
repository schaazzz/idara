import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import {Projects} from './projects';

export const Issues = new Mongo.Collection('issues');

Meteor.methods({
    'issues.insert'(project, title, description, tracker, priority, severity, dueDate, responsible) {
        check(project, String);
        check(title, String);
        check(description, String);
        check(tracker, String);
        check(priority, String);
        check(severity, String);
        check(dueDate, String)
        check(responsible, String);

        var thisProject = Projects.findOne({'name': project});

        if (Meteor.user().profile.isRoot
            || thisProject.noIssueFilingRestrictions
            || (Meteor.user().username == thisProject.admin)
            || (thisProject.pmUsers.indexOf(Meteor.user().username) >= 0)) {
                
            var workflow = thisProject.workflow;
            var participants = [];

            for (var i  = 0; i < workflow.length; i++) {
                participants.push([]);

                if (thisProject.workflow[i].hasParticipants) {
                    participants[i].push(responsible);
                }
            }

            var historyTxt = '[' + moment(new Date()).format('YYYY-MM-DD, HH:MM') + '] Issue created by ' + Meteor.user().username + ' and assigned to ' + responsible;
            Issues.insert({
                number: Issues.find({}).count() + 1,
                project: project,
                title: title,
                description: description,
                tracker: tracker,
                priority: priority,
                severity: severity,
                createdBy: Meteor.user().username,
                responsible: responsible,
                stateIndex: 0,
                stateStr: workflow[0].stateName,
                isClosed: false,
                workflow: workflow,
                createdAt: moment(new Date()).format("YYYY-MM-DD HH:mm"),
                dueDate: dueDate,
                history: [historyTxt],
                participants: participants
            });
        }
    },
    'issues.update'(project, issue, title, description, tracker, priority, severity, dueDate, responsible) {
        check(project, String);
        check(issue, Number);
        check(title, String);
        check(description, String);
        check(tracker, String);
        check(priority, String);
        check(severity, String);
        check(dueDate, String)
        check(responsible, String);

        var thisProject = Projects.findOne({'name': project});
        var thisIssue = Issues.findOne({'project': project, 'number': issue});

        thisIssue.history.push('[' + moment(new Date()).format('YYYY-MM-DD, HH:MM') + '] Issue updated by ' + Meteor.user().username);
        Issues.update({
            number: issue,
            project: project
        }, {$set: {
                title: title,
                description: description,
                tracker: tracker,
                priority: priority,
                severity: severity,
                responsible: responsible,
                dueDate: dueDate,
                history: thisIssue.history,
            }
        });
    },
    'issues.incrementState'(project, issueNumber) {
        check(project, String);
        check(issueNumber, Number);

        var thisIssue = Issues.findOne({'project': project, 'number': issueNumber});
        var thisProject = Projects.findOne({'name': project});

        if (thisIssue.responsible == Meteor.user().username) {
            if (thisIssue.stateIndex < (thisProject.workflow.length - 1)) {
                thisIssue.stateIndex += 1;
                thisIssue.isClosed = (thisIssue.stateIndex == thisIssue.workflow.length - 1);
                Issues.update({
                    'project': project, 'number': issueNumber
                }, {
                    $set: {
                        'stateIndex': thisIssue.stateIndex,
                        'isClosed': thisIssue.isClosed,
                        'stateStr': thisIssue.workflow[thisIssue.stateIndex].stateName
                    }
                });
            }
        } else {
            throw new Meteor.Error('not-authorized');
        }
    },
    'issues.setState'(project, issueNumber, state, subStateMsg) {
        check(project, String);
        check(issueNumber, Number);
        check(state, Number);

        var thisIssue = Issues.findOne({'project': project, 'number': issueNumber});
        var thisProject = Projects.findOne({'name': project});

        if (thisIssue.responsible == Meteor.user().username) {
            thisIssue.stateIndex = state;
            thisIssue.isClosed = (thisIssue.stateIndex == thisIssue.workflow.length - 1);
            Issues.update({
                'project': project, 'number': issueNumber
            }, {
                $set: {
                    'stateIndex': thisIssue.stateIndex,
                    'isClosed': thisIssue.isClosed,
                    'stateStr': thisIssue.workflow[thisIssue.stateIndex].stateName
                }
            });

            if(subStateMsg) {
                check(subStateMsg, String);
                Issues.update({'project': project, 'number': issueNumber}, {$set: {'subStateMsg': subStateMsg}});
            }
        } else {
            throw new Meteor.Error('not-authorized');
        }
    },
    'issues.addParticipant'(project, issueNumber, state, participant) {
        check(project, String);
        check(issueNumber, Number);
        check(state, Number);
        check(participant, String);

        var result = false;
        var thisIssue = Issues.findOne({'project': project, 'number': issueNumber});

        var participants = thisIssue.participants;
        if(participants[state].indexOf(participant) < 0) {
            participants[state].push(participant);
            result = true;
        }

        Issues.update({'project': project, 'number': issueNumber}, {$set: {'participants': participants}});

        return result;
    },
    'issues.addHistory'(project, issueNumber, text) {
        check(project, String);
        check(issueNumber, Number);
        check(text, String);

        var thisIssue = Issues.findOne({'project': project, 'number': issueNumber});

        var history = thisIssue.history;
        history.push(text);

        Issues.update({'project': project, 'number': issueNumber}, {$set: {'history': history}});
    }
});
