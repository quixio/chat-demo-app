import { ScrollingModule } from "@angular/cdk/scrolling";
import { NgModule } from "@angular/core";
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from "@angular/material/card";
import { MatChipsModule } from "@angular/material/chips";
import { MatDialogModule } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatSelectModule } from "@angular/material/select";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import {ClipboardModule} from '@angular/cdk/clipboard';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { A11yModule } from "@angular/cdk/a11y";

@NgModule({
  exports: [
    MatButtonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatSelectModule,
    MatMenuModule,
    MatTooltipModule,
    ScrollingModule,
    MatDialogModule,
    ClipboardModule,
    MatProgressSpinnerModule,
    A11yModule
  ]
})
export class MaterialModule { }