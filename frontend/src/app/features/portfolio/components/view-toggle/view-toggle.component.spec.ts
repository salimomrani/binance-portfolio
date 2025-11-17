// T142: View toggle component test verifying toggle behavior

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewToggleComponent } from './view-toggle.component';

describe('ViewToggleComponent', () => {
  let component: ViewToggleComponent;
  let fixture: ComponentFixture<ViewToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have table view as default', () => {
    expect(component.activeView).toBe('table');
  });

  it('should emit viewChange when view is selected', () => {
    spyOn(component.viewChange, 'emit');

    component.selectView('chart');

    expect(component.viewChange.emit).toHaveBeenCalledWith('chart');
    expect(component.activeView).toBe('chart');
  });

  it('should not emit viewChange when same view is selected', () => {
    component.activeView = 'table';
    spyOn(component.viewChange, 'emit');

    component.selectView('table');

    expect(component.viewChange.emit).not.toHaveBeenCalled();
  });

  it('should apply active class to selected view', () => {
    component.activeView = 'chart';
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.toggle-button');
    expect(buttons[0].classList.contains('active')).toBeFalse();
    expect(buttons[1].classList.contains('active')).toBeTrue();
  });
});
