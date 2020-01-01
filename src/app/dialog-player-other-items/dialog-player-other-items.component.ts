import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-dialog-player-other-items',
  templateUrl: './dialog-player-other-items.component.html',
  styleUrls: ['./dialog-player-other-items.component.css']
})
export class DialogPlayerOtherItemsComponent implements OnInit {

  name: string = ''; // プレイヤー名
  otherItems: any[] = []; // その他のプレイヤー情報

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public matDialogRef: MatDialogRef<DialogPlayerOtherItemsComponent>,
  ) {
    this.name = this.data.name;
    this.otherItems = this.convertOtherItemsToArray();
  }

  ngOnInit() {
  }

  convertOtherItemsToArray(): any[] {
    return Object.entries(this.data.otherItems);
  }

}
