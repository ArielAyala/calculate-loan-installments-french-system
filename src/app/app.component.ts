import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SeparadorMilesPipe } from "./pipes/separador-miles.pipe";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatGridListModule } from '@angular/material/grid-list';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {MatTableModule} from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';


export interface cuota {
  numeroCuota?: number;
  amortizacion?: number;
  interes?: number;
  cuota?: number;
  saldo: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SeparadorMilesPipe, MatToolbarModule, MatFormFieldModule, MatGridListModule, FormsModule, MatTableModule, FormsModule, ReactiveFormsModule, MatInputModule, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'calculate-loan-installments-french-system';

  dataSource: cuota[] = [];

  capital: string = '';
  plazo: number = 0;

  tazaInteres: number = 0;
  interesMensual: number = 0;
  cuotaMensual: number = 0;
  cuotas: cuota[] = [];
  totalAmortizacion: number = 0;
  totalInteres: number = 0;
  totalCuotas: number = 0;
  saldo: number = 0;

  columnasTabla: string[] = [
    'numero-cuota',
    'amortizacion',
    'interes',
    'saldo',
    'cuota',
  ];


  form = new FormGroup({
    amount: new FormControl('', Validators.required),
    installments: new FormControl('', Validators.required),
    interestRate: new FormControl('', Validators.required),
  });

  constructor(private _snackBar: MatSnackBar) { }


  procesar() {
    if (this.validaciones()) {
      return;
    } else {
      this.calcular();
    }
  }

  calcular() {
    this.cerearVariables();

    this.tazaInteres = this.verificarDecimal(this.tazaInteres);

    this.interesMensual = this.tazaInteres / 12;

    this.cuotaMensual =
      ((this.interesMensual / 100) * this.parsearAEntero(this.capital)) /
      (1 - Math.pow(1 / (1 + this.interesMensual / 100), this.plazo));

    this.cuotaMensual = Math.round(this.cuotaMensual); // Redondeo

    this.saldo = this.parsearAEntero(this.capital);
    for (let cuotaIndex = 1; cuotaIndex <= this.plazo; cuotaIndex++) {
      let cuota: cuota = {
        numeroCuota: cuotaIndex,
        saldo: this.saldo,
      };

      // Interes de la cuota
      cuota.interes = Math.round((cuota.saldo / 100) * this.interesMensual);

      // Amortizacion de la cuota
      cuota.amortizacion = this.cuotaMensual - cuota.interes;

      cuota.cuota = this.cuotaMensual;

      if (cuotaIndex == this.plazo) {
        cuota.amortizacion = this.saldo;
        cuota.cuota = cuota.amortizacion + cuota.interes;
      }

      // Saldo de la cuota
      this.saldo = this.saldo - cuota.amortizacion;

      this.totalAmortizacion = this.totalAmortizacion + cuota.amortizacion;
      this.totalInteres = this.totalInteres + cuota.interes;
      this.totalCuotas = this.totalAmortizacion + this.totalInteres;

      this.cuotas.push(cuota);

      cuota.saldo = cuota.saldo - cuota.amortizacion;
    }

    this.dataSource = this.cuotas;
  }

  cerearVariables() {
    this.cuotaMensual = 0;
    this.saldo = 0;
    this.cuotas = [];

    this.totalAmortizacion = 0;
    this.totalInteres = 0;
    this.totalCuotas = 0;
  }

  verificarDecimal(num: any) {
    return parseFloat(num.toString().replaceAll(',', '.'));
  }

  parseSeparadorMiles(valor: any) {
    // if (Number(valor).toString() == 'NaN') {
    //   console.log('El valor ingresado no es un número.');
    //   this.capital = '';
    // }

    valor = valor.toString().replaceAll('.', '');
    this.capital = Number(valor).toLocaleString('es-AR');
  }

  parsearAEntero(numString: any) {
    return parseInt(numString.replaceAll('.', ''));
  }

  validaciones() {
    const capital = this.parsearAEntero(this.capital);
    var regExp = /[a-zA-Z]/g;
    var testString = capital.toString();

    if (regExp.test(testString)) {
      this.openSnackBar('Monto no válido !');
      return true;
    }

    if (this.plazo == 0) {
      this.openSnackBar('Plazo no válido !');
      return true;
    }

    if (this.tazaInteres <= 0) {
      this.openSnackBar('Tasa no válida !');
      return true;
    }

    return false;
  }

  openSnackBar(mensaje: string) {
    this._snackBar.open(mensaje, '', {
      duration: 2000,
    });
  }
}
