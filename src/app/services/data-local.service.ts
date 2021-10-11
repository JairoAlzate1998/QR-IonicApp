import { Injectable } from '@angular/core';
import { Registro } from '../models/registro.model';
import { Storage } from '@ionic/storage-angular';
import { NavController } from '@ionic/angular';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { File } from '@ionic-native/file/ngx';
import { EmailComposer } from '@ionic-native/email-composer/ngx';

@Injectable({
  providedIn: 'root',
})
export class DataLocalService {
  guardados: Registro[] = [];
  private _storage: Storage | null = null;

  constructor(
    private storage: Storage,
    private navCtrl: NavController,
    private iab: InAppBrowser,
    private file: File,
    private emailComposer: EmailComposer
  ) {
    this.cargarRegistros();
  }

  guardarRegistro(format: string, text: string) {
    const nuevoRegistro = new Registro(format, text);
    this.guardados.unshift(nuevoRegistro);
    this._storage.set('registros', this.guardados);
    this.abrirRegistro(nuevoRegistro);
  }

  async cargarRegistros() {
    let storageData = await this.storage.create();
    this._storage = storageData;
    const guardados = await this._storage.get('registros');
    if (guardados) {
      this.guardados = guardados;
    } else {
      this.guardados = [];
    }
    return this.guardados;
  }

  abrirRegistro(registro: Registro) {
    this.navCtrl.navigateForward('/tabs/tab2');
    switch (registro.type) {
      case 'http':
        this.iab.create(registro.text, '_system');
        break;
      case 'geo':
        this.navCtrl.navigateForward(`/tabs/tab2/mapa/${registro.text}`);
        break;
    }
  }

  enviarCorreo() {
    const temp = [];
    const titulos = 'Tipo, Formato, Creado en, Texto\n';
    temp.push(titulos);
    this.guardados.forEach((registro) => {
      const linea = `${registro.type}, ${registro.format}, ${
        registro.created
      }, ${registro.text.replace(',', ' ')}\n`;
      temp.push(linea);
    });
    this.crearArchivoFisico(temp.join(''));
  }

  crearArchivoFisico(text: string) {
    this.file
      .checkFile(this.file.dataDirectory, 'registros.csv')
      .then((existe) => {
        console.log('Existe', existe);
        return this.escribirArchivo(text);
      })
      .catch((err) => {
        return this.file
          .createFile(this.file.dataDirectory, 'registros.csv', false)
          .then((creado) => this.escribirArchivo(text))
          .catch((err2) => {
            
            console.log('No se pudo crear el archivo');
          });
      });
  }

  async escribirArchivo(text: string) {
    await this.file.writeExistingFile(
      this.file.dataDirectory,
      'registros.csv',
      text
    );

    const archivo = `${ this.file.dataDirectory}/registros.csv`

    const email = {
      to: 'jairoalzate1998@gmail.com',
      //cc: 'erika@mustermann.de',
      //bcc: ['john@doe.com', 'jane@doe.com'],
      attachments: [
        archivo
      ],
      subject: 'Backup',
      body: 'Aqui tienen el backup de los scan',
      isHtml: true,
    };

    this.emailComposer.open(email);
  }
}
