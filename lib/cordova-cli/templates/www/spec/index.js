describe('app', function() {
    describe('initialize', function() {
        it('should bind deviceready', function() {
            runs(function() {
                spyOn(app, 'deviceready');
                app.initialize();
                helper.trigger(window.document, 'deviceready');
            });

            waitsFor(function() {
                return (app.deviceready.calls.length > 0);
            }, 'deviceready should be called once', 500);

            runs(function() {
                expect(app.deviceready).toHaveBeenCalled();
            });
        });
    });

    describe('deviceready', function() {
        it('should report that it fired', function() {
            spyOn(app, 'report');
            app.deviceready();
            expect(app.report).toHaveBeenCalledWith('deviceready');
        });
    });

    describe('report', function() {
        beforeEach(function() {
            var el = document.getElementById('stage');
            el.innerHTML = ['<div id="deviceready">',
                            '    <p class="status pending">Pending</p>',
                            '    <p class="status complete hide">Complete</p>',
                            '</div>'].join('\n');
        });

        it('should show the completion state', function() {
            app.report('deviceready');
            var el = document.querySelector('#deviceready .complete:not(.hide)');
            expect(el).toBeTruthy();
        });

        it('should hide the pending state', function() {
            app.report('deviceready');
            var el = document.querySelector('#deviceready .pending.hide');
            expect(el).toBeTruthy();
        });
    });
});
