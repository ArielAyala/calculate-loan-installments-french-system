import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThousandSeparator } from "./pipes/thousands-separator.pipe";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatGridListModule } from '@angular/material/grid-list';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


export interface installment {
  numberInstallment?: number;
  amortization?: number;
  interest?: number;
  installment?: number;
  pendingAmount: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ThousandSeparator,
    MatToolbarModule,
    MatFormFieldModule,
    MatGridListModule,
    FormsModule,
    MatTableModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  dataSource: installment[] = [];

  loanAmount: string = '';
  term: number = 0;

  interestRate: number = 0;
  interestMonthly: number = 0;
  installmenttMonthly: number = 0;
  installments: installment[] = [];
  totalAmortization: number = 0;
  totalInterest: number = 0;
  totalInstallments: number = 0;
  pendingAmount: number = 0;

  tableColumns: string[] = [
    'numberInstallment',
    'amortization',
    'interest',
    'pendingAmount',
    'installment',
  ];

  form: FormGroup;

  constructor(private _snackBar: MatSnackBar, private fb: FormBuilder) {
    this.form = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      installments: ['', [Validators.required, Validators.min(1)]],
      interestRate: ['', [Validators.required, Validators.min(0.01)]],
    });
  }

  calculate() {
    this.resetVariables();

    this.interestRate = this.checkDecimal(
      this.form.get('interestRate')?.value
    );
    this.loanAmount = this.form.get('amount')?.value;
    this.term = this.form.get('installments')?.value;

    this.interestMonthly = this.interestRate / 12;

    this.installmenttMonthly =
      ((this.interestMonthly / 100) * this.parseToInt(this.loanAmount)) /
      (1 - Math.pow(1 / (1 + this.interestMonthly / 100), this.term));

    this.installmenttMonthly = Math.round(this.installmenttMonthly); // Redondeo

    this.pendingAmount = this.parseToInt(this.loanAmount);
    for (let cuotaIndex = 1; cuotaIndex <= this.term; cuotaIndex++) {
      let cuota: installment = {
        numberInstallment: cuotaIndex,
        pendingAmount: this.pendingAmount,
      };

      // Interes de la cuota
      cuota.interest = Math.round((cuota.pendingAmount / 100) * this.interestMonthly);

      // Amortizacion de la cuota
      cuota.amortization = this.installmenttMonthly - cuota.interest;

      cuota.installment = this.installmenttMonthly;

      if (cuotaIndex == this.term) {
        cuota.amortization = this.pendingAmount;
        cuota.installment = cuota.amortization + cuota.interest;
      }

      // Saldo de la cuota
      this.pendingAmount = this.pendingAmount - cuota.amortization;

      this.totalAmortization = this.totalAmortization + cuota.amortization;
      this.totalInterest = this.totalInterest + cuota.interest;
      this.totalInstallments = this.totalAmortization + this.totalInterest;

      this.installments.push(cuota);

      cuota.pendingAmount = cuota.pendingAmount - cuota.amortization;
    }

    this.dataSource = this.installments;
  }

  resetVariables() {
    this.installmenttMonthly = 0;
    this.pendingAmount = 0;
    this.installments = [];

    this.totalAmortization = 0;
    this.totalInterest = 0;
    this.totalInstallments = 0;
  }

  checkDecimal(num: any) {
    return parseFloat(num.toString().replaceAll(',', '.'));
  }

  // parseSeparadorMiles(valor: any) {
  //   valor = valor.toString().replaceAll('.', '');
  //   const amountControl = this.form.get('amount');
  //   if (amountControl)
  //     amountControl.setValue(Number(valor).toLocaleString('es-AR'));
  // }

  parseToInt(numString: any) {
    return parseInt(numString.replaceAll('.', ''));
  }


  openSnackBar(mensaje: string) {
    this._snackBar.open(mensaje, '', {
      duration: 2000,
    });
  }

  downloadXls() {
    const headers = [
      '#',
      'Amortization',
      'Interest',
      'Pending amount',
      'Installment',
    ];

    let table = '<table><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';

    this.installments.forEach((i) => {
      table +=
        '<tr>' +
        [
          i.numberInstallment,
          i.amortization,
          i.interest,
          i.pendingAmount,
          i.installment,
        ]
          .map((v) => `<td>${v}</td>`)
          .join('') +
        '</tr>';
    });

    table += '</table>';

    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'installments.xls';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  getErrorMessage(controlName: string) {
    const control = this.form.get(controlName);

    if (control?.hasError('required') && (control.dirty || control.touched)) {
      return 'Este campo es requerido';
    }

    if (control?.hasError('min') && (control.dirty || control.touched)) {
      return 'El valor debe ser mayor que 0';
    }

    return '';
  }

  onKeyDown(event: KeyboardEvent) {
    // Allow only values type number
    if (
      (event.key < '0' || event.key > '9') &&
      ![
        'Backspace',
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'Delete',
        'Enter',
      ].includes(event.key)
    ) {
      event.preventDefault();
    }
  }
}
